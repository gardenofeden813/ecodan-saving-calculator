import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── PHYSICAL CONSTANTS ──────────────────────────────────────────────────────
const BTU_PER_THERM    = 100_000;
const BTU_PER_KWH      = 3_412;
const CO2_LB_PER_THERM = 11.7;
const CO2_LB_PER_KWH   = 0.386;
const CO2_LB_PER_TON   = 2000;

// COP lookup: [ambientF, cop] — ASHRAE cold-climate HP performance
const COP_TABLE = [
  [-5,1.5],[5,1.8],[17,2.5],[30,3.1],[40,3.6],[47,4.0],[55,4.5],[65,5.0],
];

function interpolateCOP(t) {
  if (t <= COP_TABLE[0][0]) return COP_TABLE[0][1];
  if (t >= COP_TABLE[COP_TABLE.length-1][0]) return COP_TABLE[COP_TABLE.length-1][1];
  for (let i = 0; i < COP_TABLE.length-1; i++) {
    const [t0,c0]=COP_TABLE[i], [t1,c1]=COP_TABLE[i+1];
    if (t>=t0 && t<=t1) return c0+((t-t0)/(t1-t0))*(c1-c0);
  }
  return 3.0;
}

function estimateAFUE(age) {
  if (age<=5)  return 0.96;
  if (age<=10) return 0.90;
  if (age<=15) return 0.85;
  if (age<=20) return 0.80;
  if (age<=25) return 0.78;
  return 0.75;
}

function estimateDesignTemp(zip) {
  const p = parseInt(zip.substring(0,3));
  if (p>=995) return -10; if (p>=967) return 65;
  if (p>=320&&p<=349) return 38; if (p>=900&&p<=961) return 40;
  if (p>=970&&p<=979) return 28; if (p>=980&&p<=994) return 20;
  if (p>=590&&p<=599) return -10; if (p>=570&&p<=577) return -5;
  if (p>=560&&p<=567) return -5; if (p>=530&&p<=549) return 5;
  if (p>=460&&p<=479) return 5; if (p>=600&&p<=629) return 0;
  if (p>=430&&p<=458) return 10; if (p>=480&&p<=499) return 8;
  if (p>=100&&p<=149) return 15; if (p>=150&&p<=196) return 10;
  if (p>=10&&p<=27)   return 10; if (p>=60&&p<=69)   return 10;
  if (p>=30&&p<=38)   return -5; if (p>=40&&p<=49)   return -10;
  if (p>=50&&p<=59)   return -15; if (p>=200&&p<=219) return 20;
  if (p>=220&&p<=246) return 18; if (p>=270&&p<=289) return 25;
  if (p>=290&&p<=299) return 28; if (p>=300&&p<=319) return 30;
  if (p>=350&&p<=369) return 25; if (p>=386&&p<=397) return 22;
  if (p>=700&&p<=714) return 32; if (p>=750&&p<=799) return 25;
  if (p>=800&&p<=816) return 5; if (p>=820&&p<=831)  return -5;
  if (p>=840&&p<=847) return 10; if (p>=850&&p<=865) return 35;
  if (p>=870&&p<=884) return 20; if (p>=890&&p<=898) return 25;
  return 17;
}

function zipToState(zip) {
  const p = parseInt(zip.substring(0,3));
  const m = [
    [[995,999],"AK"],[[967,968],"HI"],[[988,994],"WA"],[[970,979],"OR"],
    [[900,961],"CA"],[[800,816],"CO"],[[820,831],"WY"],[[590,599],"MT"],
    [[830,838],"ID"],[[840,847],"UT"],[[850,865],"AZ"],[[870,884],"NM"],
    [[890,898],"NV"],[[750,799],"TX"],[[700,714],"LA"],[[716,729],"AR"],
    [[730,749],"OK"],[[660,679],"KS"],[[680,693],"NE"],[[570,577],"SD"],
    [[580,588],"ND"],[[560,567],"MN"],[[530,549],"WI"],[[600,629],"IL"],
    [[460,479],"IN"],[[480,499],"MI"],[[430,458],"OH"],[[400,427],"KY"],
    [[370,385],"TN"],[[386,397],"MS"],[[350,369],"AL"],[[300,319],"GA"],
    [[320,349],"FL"],[[290,299],"SC"],[[270,289],"NC"],[[240,268],"WV"],
    [[200,219],"MD"],[[220,246],"VA"],[[150,196],"PA"],[[197,199],"DE"],
    [[70,89],"NJ"],[[100,149],"NY"],[[10,27],"MA"],[[28,29],"RI"],
    [[60,69],"CT"],[[30,38],"NH"],[[40,49],"ME"],[[50,59],"VT"],
    [[500,528],"IA"],[[630,658],"MO"],
  ];
  for (const [[lo,hi],st] of m) if (p>=lo&&p<=hi) return st;
  return null;
}

// EIA 2024 residential prices
const SP = {
  AK:{g:14.20,e:.228},AL:{g:15.10,e:.138},AR:{g:13.40,e:.112},AZ:{g:15.60,e:.142},
  CA:{g:22.80,e:.298},CO:{g:10.90,e:.148},CT:{g:24.20,e:.312},DC:{g:18.40,e:.188},
  DE:{g:16.20,e:.162},FL:{g:17.80,e:.148},GA:{g:16.20,e:.132},HI:{g:38.20,e:.438},
  IA:{g:10.80,e:.118},ID:{g:12.40,e:.098},IL:{g:12.20,e:.138},IN:{g:11.80,e:.142},
  KS:{g:10.60,e:.128},KY:{g:12.20,e:.118},LA:{g:14.80,e:.108},MA:{g:22.40,e:.288},
  MD:{g:16.80,e:.178},ME:{g:21.80,e:.258},MI:{g:12.80,e:.198},MN:{g:10.20,e:.148},
  MO:{g:11.40,e:.118},MS:{g:14.60,e:.122},MT:{g:12.80,e:.112},NC:{g:16.40,e:.128},
  ND:{g:9.80,e:.118},NE:{g:10.40,e:.128},NH:{g:20.80,e:.268},NJ:{g:17.60,e:.218},
  NM:{g:12.60,e:.138},NV:{g:13.40,e:.128},NY:{g:18.20,e:.228},OH:{g:11.80,e:.158},
  OK:{g:10.20,e:.118},OR:{g:14.80,e:.118},PA:{g:13.80,e:.168},RI:{g:22.00,e:.298},
  SC:{g:16.80,e:.138},SD:{g:10.80,e:.128},TN:{g:14.20,e:.118},TX:{g:13.80,e:.128},
  UT:{g:10.20,e:.108},VA:{g:16.20,e:.148},VT:{g:20.60,e:.218},WA:{g:12.80,e:.108},
  WI:{g:11.80,e:.158},WV:{g:13.20,e:.128},WY:{g:9.60,e:.098},
};
const US_AVG = {g:14.20,e:.168};

function calcTaxCredit(cost) { return Math.min(cost*0.30, 2000); }

function runCalc(zip, bill, age, cost) {
  const afue       = estimateAFUE(age);
  const dt         = estimateDesignTemp(zip);
  const cop        = interpolateCOP(dt);
  const state      = zipToState(zip);
  const pr         = SP[state] || US_AVG;

  const moTherms   = bill / pr.g;
  const moBtuGas   = moTherms * BTU_PER_THERM * afue;
  const moKwhHP    = moBtuGas / (BTU_PER_KWH * cop);
  const moGasCost  = bill;
  const moHPCost   = moKwhHP * pr.e;
  const moSave     = moGasCost - moHPCost;
  const yrSave     = moSave * 12;

  const mbtuGas = (pr.g / BTU_PER_THERM) * 1e6 / afue;
  const mbtuHP  = (pr.e / BTU_PER_KWH)   * 1e6 / cop;

  const yrCO2gas   = moTherms * 12 * CO2_LB_PER_THERM / CO2_LB_PER_TON;
  const yrCO2hp    = moKwhHP  * 12 * CO2_LB_PER_KWH   / CO2_LB_PER_TON;
  const yrCO2save  = yrCO2gas - yrCO2hp;

  const credit     = calcTaxCredit(cost);
  const netCost    = cost - credit;
  const payback    = yrSave > 0 ? netCost / yrSave : Infinity;

  let cum = -netCost;
  const yd = [{ year:0, cumulative:Math.round(-netCost), annual:0, gasCost:0, hpCost:0 }];
  for (let i=1;i<=10;i++) {
    const f=Math.pow(1.02,i-1), s=yrSave*f; cum+=s;
    yd.push({ year:i, cumulative:Math.round(cum), annual:Math.round(s),
      gasCost:Math.round(moGasCost*12*f), hpCost:Math.round(moHPCost*12*f) });
  }

  const copCurve = [
    ...COP_TABLE.map(([t,c])=>({temp:t,cop:parseFloat(c.toFixed(2))})),
    {temp:dt, cop:parseFloat(cop.toFixed(2)), isDesign:true},
  ].sort((a,b)=>a.temp-b.temp);

  return {
    afue,cop,dt,state,pr,
    moTherms:moTherms.toFixed(1), moKwhHP:moKwhHP.toFixed(1),
    moGasCost:moGasCost.toFixed(2), moHPCost:moHPCost.toFixed(2),
    moSave:moSave.toFixed(2), yrSave:Math.round(yrSave),
    mbtuGas:mbtuGas.toFixed(2), mbtuHP:mbtuHP.toFixed(2),
    yrCO2gas:yrCO2gas.toFixed(2), yrCO2hp:yrCO2hp.toFixed(2),
    yrCO2save:yrCO2save.toFixed(2),
    credit:Math.round(credit), netCost:Math.round(netCost),
    payback: isFinite(payback)?payback.toFixed(1):"N/A",
    yd, copCurve, tenYr:yd[10].cumulative,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ATWSimulator() {
  const [zip,  setZip]  = useState("");
  const [bill, setBill] = useState("");
  const [age,  setAge]  = useState("15");
  const [cost, setCost] = useState("12000");
  const [res,  setRes]  = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab,  setTab]  = useState("savings");
  const canvasRef = useRef(null);

  // Particle background
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const resize = () => { cv.width=cv.offsetWidth; cv.height=cv.offsetHeight; };
    resize();
    const ctx = cv.getContext("2d");
    const pts = Array.from({length:55},()=>({
      x:Math.random()*cv.width, y:Math.random()*cv.height,
      r:Math.random()*1.6+0.3,
      vx:(Math.random()-.5)*.22, vy:-(Math.random()*.38+.08),
      a:Math.random()*.4+.04,
    }));
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p=>{
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(56,189,248,${p.a})`; ctx.fill();
        p.x+=p.vx; p.y+=p.vy;
        if(p.y<0){p.y=cv.height;p.x=Math.random()*cv.width;}
        if(p.x<0||p.x>cv.width) p.vx*=-1;
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize",resize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);

  const valid = /^\d{5}$/.test(zip) && parseFloat(bill)>0 && parseFloat(cost)>0;
  const prevDesign = zip.length===5 ? estimateDesignTemp(zip) : null;
  const prevCOP    = prevDesign!==null ? interpolateCOP(prevDesign) : null;
  const prevState  = zip.length===5 ? zipToState(zip) : null;
  const prevPr     = prevState ? SP[prevState] : null;

  const run = () => {
    if (!valid) return;
    setBusy(true);
    setTimeout(()=>{
      setRes(runCalc(zip,parseFloat(bill),parseInt(age),parseFloat(cost)));
      setBusy(false);
    },720);
  };

  const TABS=[
    {id:"savings",lbl:"10-YR CURVE"},
    {id:"annual", lbl:"ANNUAL COSTS"},
    {id:"cop",    lbl:"COP CURVE"},
  ];

  const TT={
    contentStyle:{background:"#0a1628",border:"1px solid #1e4080",
    borderRadius:8,fontFamily:"Space Mono",fontSize:11},
  };

  return (
    <div style={{minHeight:"100vh",background:"#040c1a",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#ddeeff",
      position:"relative",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#040c1a}
        ::-webkit-scrollbar-thumb{background:#1b3a6b;border-radius:3px}
        input{outline:none;-webkit-appearance:none}
        input:focus{border-color:rgba(56,189,248,.65)!important;
          box-shadow:0 0 0 3px rgba(56,189,248,.12)!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .res{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both}
        .kc{transition:transform .18s,border-color .18s}
        .kc:hover{transform:translateY(-3px);border-color:rgba(56,189,248,.35)!important}
        .tb{transition:all .16s}
        .tb:hover{background:rgba(56,189,248,.1)!important}
        .pb{transition:all .2s cubic-bezier(.22,1,.36,1)}
        .pb:not(:disabled):hover{transform:translateY(-2px);
          box-shadow:0 10px 36px rgba(56,189,248,.38)!important}
        .pb:not(:disabled):active{transform:translateY(0)}
      `}</style>

      <canvas ref={canvasRef} style={{position:"fixed",inset:0,width:"100%",height:"100%",
        pointerEvents:"none",zIndex:0,opacity:.5}}/>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        backgroundImage:`linear-gradient(rgba(56,189,248,.022) 1px,transparent 1px),
        linear-gradient(90deg,rgba(56,189,248,.022) 1px,transparent 1px)`,
        backgroundSize:"52px 52px"}}/>
      <div style={{position:"fixed",top:"-25%",left:"50%",transform:"translateX(-50%)",
        width:"80vw",height:"60vw",maxWidth:900,
        background:"radial-gradient(ellipse,rgba(14,165,233,.07) 0%,transparent 70%)",
        pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:1080,margin:"0 auto",padding:"0 18px 72px"}}>

        {/* HEADER */}
        <header style={{textAlign:"center",paddingTop:50,paddingBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:13,marginBottom:12}}>
            <div style={{position:"relative",width:50,height:50}}>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",
                border:"2.5px solid #38bdf8",animation:"spin 6s linear infinite",
                borderTopColor:"transparent",borderLeftColor:"transparent"}}/>
              <div style={{position:"absolute",inset:5,borderRadius:"50%",
                background:"#040c1a",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:20}}>🌡</div>
            </div>
            <h1 style={{fontFamily:"'Orbitron',monospace",fontWeight:900,
              fontSize:"clamp(17px,3.6vw,29px)",letterSpacing:".06em",
              background:"linear-gradient(130deg,#7dd3fc 0%,#38bdf8 45%,#e0f2fe 100%)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              ATW HEAT PUMP SIMULATOR
            </h1>
          </div>
          <p style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:".12em",
            color:"#2e5070",textTransform:"uppercase"}}>
            Real-Time Cost-Benefit · US Market · Variable COP Physics · IRA §25C
          </p>
        </header>

        {/* INPUT */}
        <div style={{background:"rgba(8,18,38,.88)",border:"1px solid rgba(56,189,248,.12)",
          borderRadius:18,padding:"26px 26px 22px",marginBottom:18,backdropFilter:"blur(14px)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:16,marginBottom:18}}>
            {[
              {lbl:"ZIP Code",val:zip,set:setZip,ph:"e.g. 02134",type:"text",max:5},
              {lbl:"Monthly Gas Bill ($)",val:bill,set:setBill,ph:"e.g. 175",type:"number"},
              {lbl:"Boiler Age (yrs)",val:age,set:setAge,ph:"e.g. 15",type:"number"},
              {lbl:"Install Cost ($)",val:cost,set:setCost,ph:"e.g. 12000",type:"number"},
            ].map(f=>(
              <div key={f.lbl}>
                <label style={{display:"block",fontFamily:"'Space Mono',monospace",
                  fontSize:10,letterSpacing:".1em",color:"#2e5070",
                  textTransform:"uppercase",marginBottom:6}}>{f.lbl}</label>
                <input type={f.type} value={f.val} maxLength={f.max}
                  onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                  style={{width:"100%",background:"rgba(56,189,248,.04)",
                    border:"1px solid rgba(56,189,248,.16)",borderRadius:9,
                    padding:"10px 13px",color:"#ddeeff",fontSize:14,
                    fontFamily:"'Space Mono',monospace",transition:"all .18s"}}/>
              </div>
            ))}
          </div>

          {/* Live preview */}
          {zip.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px 18px",
              background:"rgba(56,189,248,.035)",border:"1px solid rgba(56,189,248,.07)",
              borderRadius:8,padding:"9px 13px",marginBottom:16}}>
              {[
                ["AFUE", `${(estimateAFUE(parseInt(age)||15)*100).toFixed(0)}%`],
                prevDesign!==null&&["Design Temp",`${prevDesign}°F`],
                prevCOP!==null&&["Seasonal COP",prevCOP.toFixed(2)],
                prevState&&["State",prevState],
                prevPr&&["Gas",`$${prevPr.g}/therm`],
                prevPr&&["Elec",`$${prevPr.e}/kWh`],
              ].filter(Boolean).map(([k,v])=>(
                <span key={k} style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#3a6ea0"}}>
                  {k}: <b style={{color:"#38bdf8"}}>{v}</b>
                </span>
              ))}
            </div>
          )}

          <button className="pb" onClick={run} disabled={!valid||busy} style={{
            width:"100%",padding:"14px 0",
            background:valid&&!busy?"linear-gradient(135deg,#0369a1,#38bdf8)":"rgba(56,189,248,.06)",
            border:"none",borderRadius:11,
            color:valid&&!busy?"#fff":"#2e5070",
            fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:11,
            letterSpacing:".14em",cursor:valid&&!busy?"pointer":"default",
            boxShadow:valid&&!busy?"0 4px 20px rgba(56,189,248,.2)":"none"}}>
            {busy?"⟳  COMPUTING THERMAL DYNAMICS…":"▶  RUN COST-BENEFIT ANALYSIS"}
          </button>
        </div>

        {/* RESULTS */}
        {res&&(
          <div className="res">
            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:11,marginBottom:14}}>
              {[
                {icon:"💰",lbl:"Annual Savings",val:`$${res.yrSave.toLocaleString()}`,sub:"year 1",c:"#4ade80"},
                {icon:"📈",lbl:"10-Year Net",val:`$${Math.max(0,res.tenYr).toLocaleString()}`,sub:"after install",c:"#38bdf8"},
                {icon:"⏱",lbl:"Payback",val:`${res.payback} yr`,sub:"incl. tax credit",c:"#fbbf24"},
                {icon:"🌿",lbl:"CO₂ Avoided",val:`${res.yrCO2save} t`,sub:"tons/year",c:"#a3e635"},
                {icon:"🏛",lbl:"IRA 25C Credit",val:`$${res.credit.toLocaleString()}`,sub:"30%, max $2k",c:"#f472b6"},
                {icon:"⚡",lbl:"Seasonal COP",val:res.cop.toFixed(2),sub:`at ${res.dt}°F`,c:"#34d399"},
              ].map(k=>(
                <div key={k.lbl} className="kc" style={{background:"rgba(8,18,38,.88)",
                  border:"1px solid rgba(56,189,248,.1)",borderRadius:13,
                  padding:"14px 15px",backdropFilter:"blur(10px)"}}>
                  <div style={{fontSize:20,marginBottom:5}}>{k.icon}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2e5070",
                    letterSpacing:".09em",textTransform:"uppercase",marginBottom:2}}>{k.lbl}</div>
                  <div style={{fontFamily:"'Orbitron',monospace",fontWeight:700,
                    fontSize:"clamp(15px,2vw,21px)",color:k.c,lineHeight:1.05}}>{k.val}</div>
                  <div style={{fontSize:10,color:"#2e5070",marginTop:3}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Cost/MBTU */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:14}}>
              {[
                {icon:"🔥",lbl:"Gas Boiler",sub:`AFUE ${(res.afue*100).toFixed(0)}% · $${res.pr.g}/therm`,val:res.mbtuGas,c:"#fb923c"},
                {icon:"❄",lbl:"ATW Heat Pump",sub:`COP ${res.cop.toFixed(2)} · $${res.pr.e}/kWh`,val:res.mbtuHP,c:"#38bdf8"},
              ].map(d=>(
                <div key={d.lbl} style={{background:"rgba(8,18,38,.88)",
                  border:`1px solid ${d.c}25`,borderRadius:13,
                  padding:"16px 18px",backdropFilter:"blur(10px)",textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:5}}>{d.icon}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2e5070",
                    letterSpacing:".09em",textTransform:"uppercase",marginBottom:3}}>{d.lbl}</div>
                  <div style={{fontFamily:"'Orbitron',monospace",fontWeight:900,
                    fontSize:"clamp(19px,2.8vw,30px)",color:d.c}}>${d.val}</div>
                  <div style={{fontSize:11,color:"#2e5070",marginTop:2}}>per million BTU (delivered)</div>
                  <div style={{fontSize:10,color:"#1e3a5a",marginTop:2}}>{d.sub}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:7,marginBottom:11}}>
              {TABS.map(t=>(
                <button key={t.id} className="tb" onClick={()=>setTab(t.id)} style={{
                  padding:"7px 14px",borderRadius:8,cursor:"pointer",
                  background:tab===t.id?"rgba(56,189,248,.13)":"rgba(8,18,38,.7)",
                  border:`1px solid ${tab===t.id?"rgba(56,189,248,.42)":"rgba(56,189,248,.09)"}`,
                  color:tab===t.id?"#7dd3fc":"#2e5070",
                  fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:".1em"}}>
                  {t.lbl}
                </button>
              ))}
            </div>

            {/* Chart panel */}
            <div style={{background:"rgba(8,18,38,.88)",border:"1px solid rgba(56,189,248,.09)",
              borderRadius:16,padding:"20px 10px 14px",backdropFilter:"blur(10px)",marginBottom:14}}>

              {tab==="savings"&&(
                <>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2e5070",
                    letterSpacing:".1em",marginBottom:13,paddingLeft:10,textTransform:"uppercase"}}>
                    Cumulative Net Savings · 2% Annual Escalation
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={res.yd} margin={{top:6,right:16,bottom:4,left:6}}>
                      <defs>
                        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#38bdf8" stopOpacity={.26}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,.05)"/>
                      <XAxis dataKey="year" stroke="#1e3a5a"
                        tick={{fill:"#2e5070",fontSize:9,fontFamily:"Space Mono"}}
                        label={{value:"Years",position:"insideBottom",offset:-2,fill:"#2e5070",fontSize:9}}/>
                      <YAxis stroke="#1e3a5a"
                        tick={{fill:"#2e5070",fontSize:9,fontFamily:"Space Mono"}}
                        tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip {...TT}
                        formatter={v=>[`$${v.toLocaleString()}`,"Net Cumulative"]}
                        labelFormatter={l=>`Year ${l}`}/>
                      <ReferenceLine y={0} stroke="#fb923c" strokeDasharray="5 4" strokeWidth={1.5}
                        label={{value:"Break-even",fill:"#fb923c",fontSize:9,fontFamily:"Space Mono"}}/>
                      <Area type="monotone" dataKey="cumulative" stroke="#38bdf8" strokeWidth={2.5}
                        fill="url(#ag)" dot={{fill:"#38bdf8",r:3,strokeWidth:0}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}

              {tab==="annual"&&(
                <>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2e5070",
                    letterSpacing:".1em",marginBottom:13,paddingLeft:10,textTransform:"uppercase"}}>
                    Annual Heating Cost: Gas vs ATW Heat Pump
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={res.yd.slice(1)} margin={{top:6,right:16,bottom:4,left:6}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,.05)"/>
                      <XAxis dataKey="year" stroke="#1e3a5a"
                        tick={{fill:"#2e5070",fontSize:9,fontFamily:"Space Mono"}}/>
                      <YAxis stroke="#1e3a5a"
                        tick={{fill:"#2e5070",fontSize:9,fontFamily:"Space Mono"}}
                        tickFormatter={v=>`$${v.toLocaleString()}`}/>
                      <Tooltip {...TT}
                        formatter={(v,n)=>[`$${v.toLocaleString()}`,n==="gasCost"?"Gas Boiler":"ATW HP"]}/>
                      <Legend formatter={v=>v==="gasCost"?"Gas Boiler":"ATW Heat Pump"}
                        wrapperStyle={{fontFamily:"Space Mono",fontSize:9,color:"#2e5070"}}/>
                      <Bar dataKey="gasCost" fill="#fb923c" radius={[4,4,0,0]} fillOpacity={.82}/>
                      <Bar dataKey="hpCost"  fill="#38bdf8" radius={[4,4,0,0]} fillOpacity={.82}/>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {tab==="cop"&&(
                <>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2e5070",
                    letterSpacing:".1em",marginBottom:13,paddingLeft:10,textTransform:"uppercase"}}>
                    Variable COP vs Ambient Temp · Cold-Climate HP Curve
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={res.copCurve} margin={{top:6,right:16,bottom:4,left:6}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,.05)"/>
                      <XAxis dataKey="temp" stroke="#1e3a5a"
                        tick={{fill:"#2e5070",fontSize:9,fontFamily:"Space Mono"}}
                        label={{value:"Ambient °F",position:"insideBottom",offset:-2,fill:"#2e5070",fontSize:9}}/>
                      <YAxis stroke="#1e3a5a" domain={[1,5.5]}
                        tick={{fill:"#2e5070",fontSize:9,fontFamily:"Space Mono"}}
                        label={{value:"COP",angle:-90,position:"insideLeft",fill:"#2e5070",fontSize:9}}/>
                      <Tooltip {...TT}
                        formatter={(v)=>[v.toFixed(2),"COP"]}
                        labelFormatter={l=>`${l}°F`}/>
                      <ReferenceLine x={res.dt} stroke="#fbbf24" strokeDasharray="5 4"/>
                      <Line type="monotone" dataKey="cop" stroke="#38bdf8" strokeWidth={2.5}
                        dot={(props)=>{
                          const d=props.payload;
                          return d.isDesign
                            ? <circle key={props.index} cx={props.cx} cy={props.cy} r={8}
                                fill="#fbbf24" stroke="#040c1a" strokeWidth={2}/>
                            : <circle key={props.index} cx={props.cx} cy={props.cy} r={3.5}
                                fill="#38bdf8" strokeWidth={0}/>;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p style={{textAlign:"center",fontFamily:"'Space Mono',monospace",
                    fontSize:9,color:"#2e5070",marginTop:7}}>
                    🟡 Design temp: {res.dt}°F → COP {res.cop.toFixed(2)}
                  </p>
                </>
              )}
            </div>

            {/* Breakdown table */}
            <div style={{background:"rgba(8,18,38,.88)",border:"1px solid rgba(56,189,248,.08)",
              borderRadius:14,padding:"16px 20px",backdropFilter:"blur(10px)"}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#2e5070",
                letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}>Technical Breakdown</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:"6px 24px"}}>
                {[
                  ["Monthly gas use",        `${res.moTherms} therms`],
                  ["Monthly HP electricity", `${res.moKwhHP} kWh`],
                  ["Monthly gas cost",       `$${res.moGasCost}`],
                  ["Monthly HP cost",        `$${res.moHPCost}`],
                  ["Monthly savings",        `$${res.moSave}`],
                  ["State / region",         res.state||"US Avg"],
                  ["Gas price (EIA 2024)",   `$${res.pr.g}/therm`],
                  ["Electricity price",      `$${res.pr.e}/kWh`],
                  ["Gross system cost",      `$${parseFloat(cost).toLocaleString()}`],
                  ["IRA 25C (30%)",          `-$${res.credit.toLocaleString()}`],
                  ["Net install cost",       `$${res.netCost.toLocaleString()}`],
                  ["Annual CO₂ — gas",       `${res.yrCO2gas} t`],
                  ["Annual CO₂ — HP",        `${res.yrCO2hp} t`],
                  ["CO₂ reduction",          `${res.yrCO2save} t/yr`],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",
                    borderBottom:"1px solid rgba(56,189,248,.045)",
                    paddingBottom:5,paddingTop:2}}>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#1e3a5a"}}>{k}</span>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#7dd3fc",fontWeight:700}}>{v}</span>
                  </div>
                ))}
              </div>
              <p style={{marginTop:13,fontFamily:"'Space Mono',monospace",fontSize:9,
                color:"#1a3050",lineHeight:1.75}}>
                Prices: EIA 2024 residential by state · AFUE: ENERGY STAR age table ·
                COP: ASHRAE cold-climate interpolation · CO₂: 11.7 lb/therm (EPA), 0.386 lb/kWh (eGRID 2023) ·
                IRA §25C: 30% credit, max $2,000/yr.
              </p>
            </div>
          </div>
        )}

        {!res&&!busy&&(
          <p style={{textAlign:"center",fontFamily:"'Space Mono',monospace",
            fontSize:11,color:"#1a3050",padding:"52px 0"}}>
            Enter your ZIP code and monthly gas bill to begin.
          </p>
        )}
      </div>
    </div>
  );
}
