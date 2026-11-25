import { useState } from "react";
import {
 Wallet, ArrowRight, TrendingUp, CalendarDays,
 Landmark, Target, ShieldCheck, Sparkles,
 ChartNoAxesCombined
} from "lucide-react";

export default function Landing({onStart}) {
 const [income,setIncome]=useState(30000);
 const [expenses,setExpenses]=useState(18000);
 const [target,setTarget]=useState(100000);

 const saved=income-expenses;
 const rate=income>0?saved/income*100:0;

 const money=n=>new Intl.NumberFormat("en-IN",{
  style:"currency",currency:"INR",
  maximumFractionDigits:0
 }).format(n);

 const features=[
  [CalendarDays,"Financial Calendar","Know exactly when and where you spend."],
  [ChartNoAxesCombined,"Money Insights","Understand monthly and yearly spending."],
  [Landmark,"Smart Accounts","Manage banks, cards and payment methods."],
  [Target,"Savings Goals","Turn small savings into big achievements."],
  [Wallet,"Expense Management","Track every transaction and category."],
  [ShieldCheck,"Local Privacy","Your financial records stay on your device."]
 ];

 return <div className="aurora-landing">

  <nav className="al-nav">
   <div className="al-brand">
    <span><Wallet size={24}/></span>
    Expense Tracker
   </div>
   <div className="al-links">
    <a href="#tools">Financial Tools</a>
    <a href="#features">Features</a>
    <button className="al-button" onClick={onStart}>
     Sign In <ArrowRight size={17}/>
    </button>
   </div>
  </nav>

  <section className="al-hero">
   <div className="al-copy">
    <div className="al-badge">
     <Sparkles size={15}/> YOUR MONEY. REIMAGINED.
    </div>

    <h1>Small expenses.<br/>
     <span>Big possibilities.</span>
    </h1>

    <p>
     Take control of your financial future.
     Understand every expense, discover your
     spending habits and make your savings grow.
    </p>

    <div className="al-actions">
     <button className="al-button" onClick={onStart}>
      Start my journey <ArrowRight size={19}/>
     </button>
     <a href="#tools" className="al-outline">
      Explore free tools
     </a>
    </div>

    <small>
     No bank connection. No paid subscription required.
    </small>
   </div>

   <div className="al-preview">
    <div className="al-between">
     <span>FINANCIAL PREVIEW</span>
     <TrendingUp color="#F4D38B"/>
    </div>

    <small>Estimated monthly savings</small>
    <h2 style={{color:saved>=0?"#F4D38B":"#FF9566"}}>
     {money(saved)}
    </h2>

    <div className="al-chart">
     {[35,65,43,75,55,88,68,95,78,100,84,110].map((v,i)=>
      <div key={i} className="al-chart-pair">
       <div style={{
        height:v+"px",
        background:"#24B4A7"
       }}/>
       <div style={{
        height:v*.65+"px",
        background:"#F4D38B"
       }}/>
      </div>
     )}
    </div>

    <small>Illustrative financial chart</small>

    <div className="al-stats">
     <div>
      <small>Income</small>
      <strong style={{color:"#46DFD2"}}>{money(income)}</strong>
     </div>
     <div>
      <small>Expenses</small>
      <strong style={{color:"#FF9566"}}>{money(expenses)}</strong>
     </div>
     <div>
      <small>Savings rate</small>
      <strong style={{color:"#F4D38B"}}>{rate.toFixed(1)}%</strong>
     </div>
    </div>
   </div>
  </section>

  <section id="tools" className="al-section">
   <div className="al-heading">
    <span>INTERACTIVE FINANCIAL TOOLS</span>
    <h2>Discover your financial potential.</h2>
    <p>Try our free calculators before creating an account.</p>
   </div>

   <div className="al-tools">
    <article className="al-card">
     <Wallet color="#F4D38B" size={30}/>
     <h2>Monthly budget simulator</h2>

     <label>
      Monthly income
      <strong>{money(income)}</strong>
     </label>
     <input type="range" min="1000" max="200000"
      step="1000" value={income}
      onChange={e=>setIncome(Number(e.target.value))}/>

     <label>
      Monthly expenses
      <strong>{money(expenses)}</strong>
     </label>
     <input type="range" min="0" max="200000"
      step="500" value={expenses}
      onChange={e=>setExpenses(Number(e.target.value))}/>

     <div className="al-result">
      <small>Potential monthly savings</small>
      <h2 style={{color:saved>=0?"#F4D38B":"#FF9566"}}>
       {money(saved)}
      </h2>
      <small>Potential yearly savings</small>
      <h3>{money(saved*12)}</h3>
     </div>

     <p>{saved>=0?
      `You could save ${rate.toFixed(1)}% of your monthly income.`:
      "Your estimated expenses exceed your income."
     }</p>
    </article>

    <article className="al-card">
     <Target color="#46DFD2" size={30}/>
     <h2>Savings goal calculator</h2>
     <label>
      Your dream savings target
      <strong>{money(target)}</strong>
     </label>
     <input type="range" min="5000" max="1000000"
      step="5000" value={target}
      onChange={e=>setTarget(Number(e.target.value))}/>

     <div className="al-result">
      <small>Estimated time to reach your goal</small>
      <h2 style={{color:"#46DFD2"}}>
       {saved>0?Math.ceil(target/saved)+" months":"Not yet achievable"}
      </h2>
      <p>Based on your estimated monthly savings.</p>
     </div>

     <button className="al-button" onClick={onStart}>
      Start saving <ArrowRight size={18}/>
     </button>
    </article>
   </div>
  </section>

  <section id="features" className="al-section">
   <div className="al-heading">
    <span>EVERYTHING IN ONE PLACE</span>
    <h2>More than an expense tracker.</h2>
   </div>

   <div className="al-features">
    {features.map(([Icon,title,text])=>
     <article className="al-card" key={title}>
      <Icon size={32} color="#BBA6FF"/>
      <h3>{title}</h3>
      <p>{text}</p>
     </article>
    )}
   </div>
  </section>

  <section className="al-final">
   <h2>Make today the start of better money habits.</h2>
   <button className="al-button" onClick={onStart}>
    Get started <ArrowRight size={18}/>
   </button>
  </section>

  <footer className="al-footer">
   Expense Tracker | Designed for smarter financial decisions
  </footer>

 </div>;
}

