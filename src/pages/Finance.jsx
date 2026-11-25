import {useState,useEffect} from "react";
import {
 Wallet, LayoutDashboard, Receipt, Banknote,
 CalendarDays, Landmark, ChartNoAxesCombined,
 Target, Users, Layers, Repeat, ArrowLeftRight,
 FileDown, UserRound, LogOut, Plus, Trash2,
 ChevronLeft, ChevronRight, Sparkles, Menu
} from "lucide-react";
import Profile from "./Profile";
import "./../styles/aurora.css";

const defaults = {
 members:[],expenses:[],income:[],budget:0,
 accounts:[],goals:[],bills:[],transfers:[],
 settlements:[],categories:[
 "Food & Dining","Shopping","Transportation",
 "Education","Healthcare","Entertainment",
 "Bills & Utilities","Groceries","Travel","Other"
 ],categoryBudgets:{}
};

const banks = [
 "State Bank of India","HDFC Bank","ICICI Bank",
 "Axis Bank","Kotak Mahindra Bank","Bank of Baroda",
 "Punjab National Bank","Canara Bank","Indian Bank",
 "Union Bank of India","IDFC FIRST Bank",
 "Federal Bank","IndusInd Bank","Yes Bank"
];

const methods = [
 "UPI","Cash","Debit Card","Credit Card",
 "Bank Transfer","Other"
];

const currencies = ["INR","USD","EUR","GBP","AED","JPY","CAD","AUD","SGD"];

const palette = [
 "#24B4A7","#FF9566","#46DFD2","#E6B85C",
 "#D5AD57","#ED9BD0","#77A6E8","#A6A4BF"
];

const uid = () => crypto.randomUUID();

const dateString = d =>
 `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const today = () => dateString(new Date());

const money = (n,c="INR") => new Intl.NumberFormat("en-IN",{
 style:"currency",currency:c,maximumFractionDigits:2
}).format(Number(n)||0);

const amount = e => Number(e.baseAmount ?? e.amount)||0;
const sum = a => a.reduce((s,e)=>s+amount(e),0);
const round = n => Math.round(n*100)/100;
const pct = (a,b) => b>0 ? (a/b*100).toFixed(1)+"%" : "N/A";

function normalize(value){
 const d={...defaults,...value};
 for(const k of [
 "members","expenses","income","accounts",
 "goals","bills","transfers","settlements","categories"
 ]){
  if(!Array.isArray(d[k])) d[k]=defaults[k];
 }
 return d;
}

function read(key){
 try{return normalize(JSON.parse(localStorage.getItem(key))||{});}
 catch{return normalize({});}
}

function download(name,text,type){
 const u=URL.createObjectURL(new Blob([text],{type}));
 const a=document.createElement("a");
 a.href=u;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(u),1000);
}

function Panel({title,sub,children}){
 return <section className="af-panel">
  <h2>{title}</h2>{sub&&<p className="af-muted">{sub}</p>}
  {children}
 </section>;
}

function Stat({title,value,color,detail}){
 const t=title.toLowerCase();

 const symbol=t.includes("rate")?"%":
  t.includes("spent")||t.includes("spending")?"↗":
  t.includes("income")||t.includes("received")?"↙":"₹";

 return <div className="af-stat">
  <span className="af-stat-symbol"
   style={{background:color+"16",color}}>
   {symbol}
  </span>
  <span>{title}</span>
  <strong style={{color}}>{value}</strong>
  {detail&&<small>{detail}</small>}
 </div>;
}
function Select({options,...props}){
 return <select {...props}>
  {options.map(o=>{
   const v=typeof o==="string"?o:o.value;
   const l=typeof o==="string"?o:o.label;
   return <option key={v} value={v}>{l}</option>;
  })}
 </select>;
}

function Bars({records,total}){
 if(!records.length)return <p className="af-empty">No expenses recorded for this period.</p>;
 return <div className="af-bars">
 {records.map((r,i)=><div key={r.name}>
  <div className="af-between">
   <strong>{r.name}</strong>
   <span>{money(r.value)} · {pct(r.value,total)}</span>
  </div>
  <div className="af-track">
   <div style={{
    width:(total?Math.min(100,r.value/total*100):0)+"%",
    background:palette[i%palette.length]
   }}/>
  </div>
 </div>)}
 </div>;
}

function group(records,key){
 const values=new Map();
 records.forEach(e=>{
  const k=e[key]||"Other";
  values.set(k,(values.get(k)||0)+amount(e));
 });
 return [...values].map(([name,value])=>({name,value}))
 .sort((a,b)=>b.value-a.value);
}

function YearGraph({records}){
 const max=Math.max(1,...records.flatMap(r=>[
 r.spent,Math.abs(r.saved)
 ]));
 return <div className="af-year-chart">
  <div className="af-legend">
   <span><i style={{background:"#FF9566"}}/> Spent</span>
   <span><i style={{background:"#F4D38B"}}/> Net savings</span>
   <span><i style={{background:"#E75B68"}}/> Deficit</span>
  </div>
  <div className="af-chart-scroll">
   <div className="af-chart-columns">
    {records.map(r=><div className="af-month" key={r.name}>
     <div className="af-column-pair">
      <div title={`${r.name} spent: ${money(r.spent)}`}
       style={{height:r.spent/max*160+"px",background:"#FF9566"}}/>
      <div title={`${r.name} net savings: ${money(r.saved)}`}
       style={{height:Math.abs(r.saved)/max*160+"px",
       background:r.saved<0?"#E75B68":"#F4D38B"}}/>
     </div>
     <small>{r.name}</small>
     <small className="af-chart-value">{money(r.spent)}</small>
     <small className="af-chart-value">{money(r.saved)}</small>
    </div>)}
   </div>
  </div>
 </div>;
}

export default function Finance({user,setUser,onLogout}){
 const key="expenses-"+user.id;
 const [data,setData]=useState(()=>read(key));
 const [page,setPage]=useState("Dashboard");
 const [year,setYear]=useState(new Date().getFullYear());
 const [month,setMonth]=useState(new Date().getMonth());
 const [selected,setSelected]=useState(today());
 const [search,setSearch]=useState("");
 const [categoryFilter,setCategoryFilter]=useState("All");
 const [paymentFilter,setPaymentFilter]=useState("All");
 const [message,setMessage]=useState("");
 const [menuOpen,setMenuOpen]=useState(false);
 const [editing,setEditing]=useState(null);

 const fresh=()=>({
  title:"",amount:"",currency:"INR",rate:"1",
  category:"Food & Dining",paymentMethod:"UPI",
  accountId:"",memberId:"",date:today(),
  description:"",merchant:"",splitMode:"None",
  splitValues:""
 });

 const [form,setForm]=useState(fresh);
 const [name,setName]=useState("");
 const [account,setAccount]=useState({
  name:"",bank:banks[0],custom:"",
  type:"Savings Account",opening:"",last4:"",
  limit:"",due:""
 });
 const [goal,setGoal]=useState({name:"",target:"",saved:""});
 const [bill,setBill]=useState({
  title:"",amount:"",date:today(),category:"Bills & Utilities"
 });
 const [transfer,setTransfer]=useState({from:"",to:"",amount:""});
 const [budget,setBudget]=useState(data.budget||"");
 const [budgetCategory,setBudgetCategory]=useState("Food & Dining");
 const [categoryLimit,setCategoryLimit]=useState("");
 const [settle,setSettle]=useState({from:"",to:"",amount:""});

 useEffect(()=>localStorage.setItem(key,JSON.stringify(data)),[data,key]);

 function notify(text){setMessage(text);}
 function navigate(p){
  setPage(p);setMessage("");setMenuOpen(false);
  setEditing(null);setForm({...fresh(),category:p==="Income"?"Salary":"Food & Dining"});setName("");setSearch("");setCategoryFilter("All");setPaymentFilter("All");
  window.scrollTo(0,0);
 }

 function field(k,v){setForm(f=>({...f,[k]:v}));}
 function append(k,v){setData(d=>({...d,[k]:[...d[k],v]}));}
 function remove(k,id){
  if(!window.confirm("Delete this record?"))return;
  setData(d=>({...d,[k]:d[k].filter(e=>e.id!==id)}));
 }

 const memberName=id=>data.members.find(m=>m.id===id)?.name||"Personal";
 const accountName=id=>data.accounts.find(a=>a.id===id)?.name||"Not specified";
 const yearPrefix=String(year);
 const monthPrefix=`${year}-${String(month+1).padStart(2,"0")}`;

 const yearExpenses=data.expenses.filter(e=>e.date?.startsWith(yearPrefix));
 const yearIncome=data.income.filter(e=>e.date?.startsWith(yearPrefix));
 const monthExpenses=data.expenses.filter(e=>e.date?.startsWith(monthPrefix));
 const monthIncome=data.income.filter(e=>e.date?.startsWith(monthPrefix));
 const spent=sum(monthExpenses);
 const received=sum(monthIncome);
 const saved=received-spent;

 const annual=Array.from({length:12},(_,i)=>{
  const p=`${year}-${String(i+1).padStart(2,"0")}`;
  const s=sum(data.expenses.filter(e=>e.date?.startsWith(p)));
  const inc=sum(data.income.filter(e=>e.date?.startsWith(p)));
  return {name:new Date(year,i,1).toLocaleString("en",{month:"short"}),
  spent:s,income:inc,saved:inc-s};
 });

 const highest=annual.reduce((a,b)=>b.spent>a.spent?b:a,annual[0]);
 const best=annual.filter(r=>r.income||r.spent)
 .sort((a,b)=>b.saved-a.saved)[0];

 const categories=group(monthExpenses,"category");
 const allYears=Array.from({length:new Date().getFullYear()-1899},(_,i)=>new Date().getFullYear()-i);

 function periodControls(){
  function move(delta){
   const d=new Date(year,month+delta,1);

   if(d.getFullYear()<1900||
      d.getFullYear()>new Date().getFullYear())return;

   setYear(d.getFullYear());
   setMonth(d.getMonth());
   setSelected(dateString(d));
  }

  return <div className="af-period">

   <button className="af-ghost"
    aria-label="Previous month"
    onClick={()=>move(-1)}>
    <ChevronLeft size={19}/>
   </button>

   <Select value={month}
    onChange={e=>{
     const m=Number(e.target.value);
     setMonth(m);
     setSelected(dateString(new Date(year,m,1)));
    }}
    options={Array.from({length:12},(_,i)=>({
     value:i,
     label:new Date(year,i,1).toLocaleString("en",{month:"long"})
    }))}/>

   <Select value={year}
    onChange={e=>{
     const y=Number(e.target.value);
     setYear(y);
     setSelected(dateString(new Date(y,month,1)));
    }}
    options={allYears.map(y=>({value:y,label:String(y)}))}/>

   <button className="af-ghost"
    aria-label="Next month"
    onClick={()=>move(1)}>
    <ChevronRight size={19}/>
   </button>

   <button className="af-primary" onClick={()=>{
    const d=new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(today());
   }}>
    Today
   </button>

  </div>;
 }
function saveTransaction(e,type){
  e.preventDefault();
  const a=Number(form.amount);
  const r=form.currency==="INR"?1:Number(form.rate);
  if(!form.title.trim()||!Number.isFinite(a)||a<=0||
  !Number.isFinite(r)||r<=0||!form.date){
   return notify("Enter valid transaction details and exchange rate.");
  }

  const base=round(a*r);
  if(!Number.isFinite(base)||base<=0)return notify("Invalid converted amount.");

  let splits=[];
  if(type==="expenses"&&form.splitMode!=="None"){
   if(!form.memberId||!data.members.length)
    return notify("Select the member who paid.");

   if(form.splitMode==="Equal"){
    const cents=Math.round(base*100);
    const each=Math.floor(cents/data.members.length);
    splits=data.members.map((m,i)=>({
     memberId:m.id,
     amount:(each+(i<cents%data.members.length?1:0))/100
    }));
   }else{
    const values=form.splitValues.split(",").map(Number);
    if(values.length!==data.members.length||
    values.some(v=>!Number.isFinite(v)||v<0)||
    Math.round(values.reduce((s,v)=>s+v,0)*100)!==Math.round(base*100))
     return notify("Custom shares must equal the converted INR total.");
    splits=data.members.map((m,i)=>({
     memberId:m.id,amount:round(values[i])
    }));
   }
  }

  const item={...form,id:editing||uid(),
   title:form.title.trim(),amount:a,rate:r,
   baseAmount:base,splits
  };

  setData(d=>({...d,[type]:editing?
   d[type].map(t=>t.id===editing?item:t):
   [...d[type],item]
  }));

  setForm({...fresh(),category:type==="income"?"Salary":"Food & Dining"});setEditing(null);
  notify("Transaction saved successfully.");
 }

 function editTransaction(t){
  setEditing(t.id);
  setForm({...fresh(),...t,
   currency:t.currency||"INR",
   rate:t.rate||1,
   splitValues:data.members.map(m=>
    t.splits?.find(s=>s.memberId===m.id)?.amount||0
   ).join(",")
  });
  window.scrollTo({top:0,behavior:"smooth"});
 }

 function transactionTable(records,type){
  return <div className="af-table-wrap">
   <table className="af-table">
    <thead><tr>
     <th>Date</th><th>Transaction</th><th>Category</th>
     <th>Account / method</th><th>Member</th>
     <th>Amount</th><th>Actions</th>
    </tr></thead>
    <tbody>{[...records].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>
     <tr key={t.id}>
      <td>{t.date}</td>
      <td><strong>{t.title}</strong><br/><small>{t.description}</small></td>
      <td><span className="af-tag">{t.category}</span></td>
      <td>{accountName(t.accountId)}<br/><small>{t.paymentMethod}</small></td>
      <td>{memberName(t.memberId)}</td>
      <td><strong>{money(t.amount,t.currency||"INR")}</strong>
       {t.currency&&t.currency!=="INR"&&<small><br/>{money(amount(t))} equivalent</small>}
      </td>
      <td><button className="af-ghost" onClick={()=>editTransaction(t)}>Edit</button>
       <button className="af-danger" onClick={()=>remove(type,t.id)}>Delete</button></td>
     </tr>
    )}</tbody>
   </table>
   {!records.length&&<p className="af-empty">No transactions found.</p>}
  </div>;
 }

 function transactionPage(type){
  const isExpense=type==="expenses";
  const list=data[type].filter(t=>
   [t.title,t.description,t.category,memberName(t.memberId),accountName(t.accountId)]
    .join(" ").toLowerCase().includes(search.toLowerCase())&&
   (categoryFilter==="All"||t.category===categoryFilter)&&
   (paymentFilter==="All"||t.paymentMethod===paymentFilter)
  );

  return <>
   <Panel title={editing?"Edit transaction":isExpense?"Record an expense":"Record income"}
    sub="Record what happened, how you paid and where your money went.">
    <form className="af-form" onSubmit={e=>saveTransaction(e,type)}>
     <label>Transaction name<input required value={form.title} onChange={e=>field("title",e.target.value)}/></label>
     <label>Amount<input required type="number" min=".01" step=".01" value={form.amount} onChange={e=>field("amount",e.target.value)}/></label>
     <label>Currency<Select options={currencies} value={form.currency} onChange={e=>{field("currency",e.target.value);field("rate",e.target.value==="INR"?"1":"");}}/></label>

     {form.currency!=="INR"&&<label>INR per 1 {form.currency} (recorded rate)
      <input required type="number" min=".000001" step="any" value={form.rate} onChange={e=>field("rate",e.target.value)}/>
     </label>}

     <label>Category<Select options={isExpense?data.categories:["Salary","Allowance","Business","Freelance","Interest","Gift","Other"]} value={form.category} onChange={e=>field("category",e.target.value)}/></label>
     <label>Date<input required type="date" value={form.date} max={today()} onChange={e=>field("date",e.target.value)}/></label>
     <label>Payment method<Select options={methods} value={form.paymentMethod} onChange={e=>field("paymentMethod",e.target.value)}/></label>
     <label>Bank / card / wallet<Select value={form.accountId} onChange={e=>field("accountId",e.target.value)}
      options={[{value:"",label:"Not specified"},...data.accounts.map(a=>({value:a.id,label:a.name+" - "+a.type}))]}/></label>
     <label>Paid by / received by<Select value={form.memberId} onChange={e=>field("memberId",e.target.value)}
      options={[{value:"",label:"Personal"},...data.members.map(m=>({value:m.id,label:m.name}))]}/></label>
     <label>Merchant or source<input value={form.merchant} onChange={e=>field("merchant",e.target.value)}/></label>

     {isExpense&&<label>Expense splitting<Select options={["None","Equal","Custom"]} value={form.splitMode} onChange={e=>field("splitMode",e.target.value)}/></label>}
     {isExpense&&form.splitMode==="Custom"&&<label>INR shares: {data.members.map(m=>m.name).join(", ")}
      <input value={form.splitValues} onChange={e=>field("splitValues",e.target.value)} placeholder="100,200,300"/>
     </label>}

     <label className="af-full">Notes<textarea value={form.description} onChange={e=>field("description",e.target.value)}/></label>
     <button className="af-primary">{editing?"Update transaction":"Save transaction"}</button>
     {editing&&<button type="button" className="af-ghost" onClick={()=>{setEditing(null);setForm(fresh());}}>Cancel edit</button>}
    </form>
    <button className="af-ghost" onClick={()=>navigate("My Accounts")}>+ Manage banks and cards</button>
   </Panel>
   <Panel title="Transaction history">
    <div className="af-actions">
     <input placeholder="Search transactions..." value={search} onChange={e=>setSearch(e.target.value)}/>
     <Select options={["All",...new Set(data[type].map(t=>t.category))]} value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}/>
     <Select options={["All",...methods]} value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)}/>
    </div>
    {transactionTable(list,type)}
   </Panel>
  </>;
 }

 function accountBalance(a){
  const income=sum(data.income.filter(e=>e.accountId===a.id));
  const expense=sum(data.expenses.filter(e=>e.accountId===a.id));
  const incoming=sum(data.transfers.filter(e=>e.to===a.id));
  const outgoing=sum(data.transfers.filter(e=>e.from===a.id));
  return a.type==="Credit Card"?
   Number(a.opening||0)+expense-income-incoming+outgoing:
   Number(a.opening||0)+income-expense+incoming-outgoing;
 }

 function accountsPage(){
  return <>
   <Panel title="Add bank account, card or wallet" sub="Manual financial records. No connection to your bank is required.">
    <form className="af-form" onSubmit={e=>{
     e.preventDefault();
     const bank=account.bank==="Add new bank"?account.custom.trim():account.bank;
     if(!account.name.trim()||(!bank&&account.type!=="Cash Wallet"))return notify("Enter account details.");
     if(account.last4&&!/^\d{4}$/.test(account.last4))return notify("Only four digits are allowed.");
     append("accounts",{...account,id:uid(),bank});
     setAccount({...account,name:"",custom:"",opening:"",last4:"",limit:"",due:""});
     notify("Account added.");
    }}>
     <label>Account nickname<input required value={account.name} onChange={e=>setAccount({...account,name:e.target.value})}/></label>
     <label>Account type<Select options={["Savings Account","Current Account","Debit Card","Credit Card","Cash Wallet","Other"]} value={account.type} onChange={e=>setAccount({...account,type:e.target.value})}/></label>
     {account.type!=="Cash Wallet"&&<>
      <label>Bank<Select options={[...banks,"Add new bank"]} value={account.bank} onChange={e=>setAccount({...account,bank:e.target.value})}/></label>
      {account.bank==="Add new bank"&&<label>Custom bank name<input required value={account.custom} onChange={e=>setAccount({...account,custom:e.target.value})}/></label>}
      <label>Last four digits (optional)<input maxLength={4} pattern="[0-9]{4}" value={account.last4} onChange={e=>setAccount({...account,last4:e.target.value})}/></label>
     </>}
     <label>{account.type==="Credit Card"?"Opening outstanding (INR)":"Opening balance (INR)"}<input type="number" step=".01" value={account.opening} onChange={e=>setAccount({...account,opening:e.target.value})}/></label>
     {account.type==="Credit Card"&&<>
      <label>Credit limit<input type="number" min="0" value={account.limit} onChange={e=>setAccount({...account,limit:e.target.value})}/></label>
      <label>Payment due date<input type="date" value={account.due} onChange={e=>setAccount({...account,due:e.target.value})}/></label>
     </>}
     <button className="af-primary">Add account</button>
    </form>
    <p className="af-muted">Do not enter PIN, CVV, full card numbers or banking passwords. Avoid recording a debit card separately from its linked bank balance.</p>
   </Panel>
   <div className="af-grid">
    {data.accounts.map((a,i)=><article className="af-bank" key={a.id} style={{background:["#322957","#5443AC","#176F78"][i%3]}}>
     <Landmark size={28}/><h2>{a.name}</h2>
     <p>{a.bank} · {a.type}</p>
     <small>{a.type==="Credit Card"?"Recorded outstanding":"Recorded balance"}</small>
     <h1>{money(accountBalance(a))}</h1>
     {a.last4&&<p>•••• {a.last4}</p>}
     {a.type==="Credit Card"&&<p>Credit utilization: {pct(accountBalance(a),Number(a.limit))}<br/>Due: {a.due||"Not set"}</p>}
     <button className="af-ghost" onClick={()=>{
      if([...data.expenses,...data.income].some(t=>t.accountId===a.id)||
       data.transfers.some(t=>t.from===a.id||t.to===a.id))
       return notify("This account has linked transactions.");
      remove("accounts",a.id);
     }}>Remove account</button>
    </article>)}
   </div>
   <Panel title="Transfer between accounts" sub="Transfers do not count as new income or expenses. Credit card repayments can be recorded as transfers.">
    <form className="af-form" onSubmit={e=>{
     e.preventDefault();
     if(!transfer.from||!transfer.to||transfer.from===transfer.to||Number(transfer.amount)<=0)
      return notify("Choose two different accounts and a positive amount.");
     if(data.accounts.find(a=>a.id===transfer.from)?.type==="Credit Card")
      return notify("Use a bank or cash account as the transfer source.");
     append("transfers",{...transfer,amount:Number(transfer.amount),id:uid(),date:today()});
     notify("Transfer recorded.");setTransfer({from:"",to:"",amount:""});
    }}>
     {["from","to"].map(k=><label key={k}>{k==="from"?"From account":"To account"}
      <Select value={transfer[k]} onChange={e=>setTransfer({...transfer,[k]:e.target.value})}
       options={[{value:"",label:"Select account"},...data.accounts.map(a=>({value:a.id,label:a.name}))]}/>
     </label>)}
     <label>Amount in INR<input required type="number" min=".01" step=".01" value={transfer.amount} onChange={e=>setTransfer({...transfer,amount:e.target.value})}/></label>
     <button className="af-primary">Record transfer</button>
    </form>
    {data.transfers.map(t=><div className="af-record" key={t.id}>
     {accountName(t.from)} → {accountName(t.to)} · {money(t.amount)}
     <button className="af-danger" onClick={()=>remove("transfers",t.id)}>Delete</button>
    </div>)}
   </Panel>
  </>;
 }

 function dashboard(){
 return <>
  {periodControls()}

  <div className="af-hero af-compact-hero">
   <div>
    <span className="af-hero-label">YOUR FINANCIAL UNIVERSE</span>
    <h1>Hello, {user.name}!</h1>
    <p>Small steps. Big possibilities.</p>

    <div className="af-quick-actions">
     <button className="af-lime" onClick={()=>navigate("Expenses")}>
      <Plus size={17}/> Expense
     </button>
     <button className="af-hero-secondary" onClick={()=>navigate("Income")}>
      <Banknote size={17}/> Income
     </button>
     <button className="af-hero-secondary" onClick={()=>navigate("Calendar")}>
      <CalendarDays size={17}/> Calendar
     </button>
    </div>
   </div>

   <div className="af-hero-total">
<div className="ec-savings-ring">
 <div className="ec-ring" style={{
  "--progress":(received>0?
   Math.max(0,Math.min(100,saved/received*100)):0)+"%"
 }}>
  <div className="ec-ring-center">
   <strong>{received>0?pct(saved,received):"N/A"}</strong>
   <small>SAVINGS RATE</small>
  </div>
 </div>
 <div className="ec-ring-caption">
  {received>0?
   saved>=0?"Your recorded savings progress":
   "Expenses exceed recorded income":
   "Add income to calculate savings progress"}
 </div>
</div>
    <small>NET SAVINGS FOR SELECTED MONTH</small>

    <strong className="af-big"
     style={{color:saved>=0?"#F4D38B":"#FF9566"}}>
     {money(saved)}
    </strong>

    <span>{received>0?pct(saved,received)+" savings rate":"Record income to begin"}</span>
   </div>
  </div>

  <div className="af-stat-grid">
   <Stat title="Money received" value={money(received)} color="#087C70"/>
   <Stat title="Money spent" value={money(spent)} color="#BC582E"/>
   <Stat title="Net savings" value={money(saved)} color={saved>=0?"#96701F":"#BC582E"}/>
   <Stat title="Savings rate" value={pct(saved,received)} color="#176A70"/>
  </div>

  {!data.expenses.length&&!data.income.length&&
   <Panel title="Your journey starts here"
    sub="Complete these three simple steps.">

    <div className="af-start-grid">
     {[
      ["01","Add income","Record your earnings.","Income"],
      ["02","Add expense","Understand your spending.","Expenses"],
      ["03","Set budget","Build better money habits.","Budgets"]
     ].map(([n,t,d,p])=>
      <button key={n} className="af-start-card"
       onClick={()=>navigate(p)}>
       <span>{n}</span>
       <strong>{t}</strong>
       <small>{d}</small>
      </button>
     )}
    </div>
   </Panel>
  }

  <div className="af-grid">

   <Panel title="Where did my money go?"
    sub="Category-wise spending for this month">

    <Bars records={categories} total={spent}/>

    {categories[0]&&
     <p className="af-insight">
      Your biggest expense is {categories[0].name}.
      It represents {pct(categories[0].value,spent)}
      {" "}of your monthly spending.
     </p>
    }
   </Panel>

   <Panel title="Your budget at a glance">

    <h1>{data.budget?
     money(Number(data.budget)-spent):
     "No budget set"}
    </h1>

    <p>{data.budget?
     pct(spent,Number(data.budget))+" of your budget used":
     "Create a monthly spending limit."}
    </p>

    <div className="af-track">
     <div style={{
      width:(data.budget?
       Math.min(100,spent/data.budget*100):0)+"%",
      background:spent>data.budget?"#FF9566":"#176A70"
     }}/>
    </div>

    {data.budget>0&&spent>data.budget&&
     <p className="af-warning">You have exceeded your budget.</p>
    }

    <button className="af-primary"
     onClick={()=>navigate("Budgets")}>
     Manage budget
    </button>

   </Panel>

  </div>

  <Panel title="Your yearly money story"
   sub={year+" | Spending and savings across all twelve months."}>

   <YearGraph records={annual}/>

   <button className="af-primary"
    onClick={()=>navigate("Analytics")}>
    Explore detailed financial analytics
   </button>

  </Panel>

  <div className="af-grid">

   <Panel title="Highest spending month">
    <h1>{highest.spent?highest.name:"No expenses yet"}</h1>
    <h2 style={{color:"#BC582E"}}>{money(highest.spent)}</h2>
    <p>{pct(highest.spent,sum(yearExpenses))} of annual expenses</p>
    <p>{pct(highest.spent,highest.income)} of monthly income</p>
   </Panel>

   <Panel title="Best savings month">
    <h1>{best?.name||"No records yet"}</h1>
    <h2 style={{color:best?.saved>=0?"#96701F":"#BC582E"}}>
     {money(best?.saved||0)}
    </h2>
    <p>Savings rate: {pct(best?.saved||0,best?.income||0)}</p>
   </Panel>

   <Panel title="Smart financial insights">

    <p className="af-insight">
     {received>0?
      "Your savings rate is "+pct(saved,received)+".":
      "Record income to calculate your savings rate."}
    </p>

    <p className="af-insight">
     {saved<0?
      "Your expenses exceed recorded income. Review unnecessary spending.":
      "Build an emergency fund by saving consistently."}
    </p>

   </Panel>

   <Panel title="Recent expenses">

    {[...monthExpenses]
     .sort((a,b)=>b.date.localeCompare(a.date))
     .slice(0,5).map(t=>
      <div className="af-record" key={t.id}>
       <span>{t.title}<small> · {t.category}</small></span>
       <strong>{money(amount(t))}</strong>
      </div>
    )}

    {!monthExpenses.length&&
     <p className="af-empty">No expenses recorded this month.</p>}

   </Panel>

  </div>

 </>;
}
function analytics(){
  const yi=sum(yearIncome),ys=sum(yearExpenses);
  return <>
   {periodControls()}
   <div className="af-stat-grid">
    <Stat title={`${year} income`} value={money(yi)} color="#117E78"/>
    <Stat title={`${year} spending`} value={money(ys)} color="#C34D36"/>
    <Stat title={`${year} net savings`} value={money(yi-ys)} color={yi>=ys?"#96701F":"#C34D36"}/>
    <Stat title="Annual savings rate" value={pct(yi-ys,yi)} color="#176A70"/>
   </div>
   <Panel title="Your yearly money story" sub="Coral is money spent. Lime is money saved. Pink indicates a deficit. All totals use recorded INR equivalents.">
    <YearGraph records={annual}/>
   </Panel>
   <div className="af-grid">
    <Panel title="Highest spending month">
     <h1>{highest.spent?highest.name:"No recorded expenses"}</h1>
     <h2 style={{color:"#C34D36"}}>{money(highest.spent)}</h2>
     <p>{pct(highest.spent,ys)} of annual spending</p>
     <p>{pct(highest.spent,highest.income)} of that month's recorded income</p>
    </Panel>
    <Panel title="Best savings month">
     <h1>{best?.name||"No records"}</h1>
     <h2 style={{color:best?.saved>=0?"#96701F":"#C34D36"}}>{money(best?.saved||0)}</h2>
     <p>Savings rate: {pct(best?.saved||0,best?.income||0)}</p>
    </Panel>
    <Panel title="Monthly spending by category">
     <Bars records={categories} total={spent}/>
    </Panel>
    <Panel title="Monthly payment methods">
     <Bars records={group(monthExpenses,"paymentMethod")} total={spent}/>
    </Panel>
    <Panel title="Annual category analysis">
     <Bars records={group(yearExpenses,"category")} total={ys}/>
    </Panel>
    <Panel title="Bank and wallet spending">
     <Bars records={group(monthExpenses.map(e=>({...e,accountName:accountName(e.accountId)})),"accountName")} total={spent}/>
    </Panel>
   </div>
   <Panel title="Every ₹100 you received">
    {received>0?<p className="af-insight">You spent ₹{(spent/received*100).toFixed(1)} and {saved>=0?"saved":"had a deficit of"} ₹{(Math.abs(saved)/received*100).toFixed(1)} for every ₹100 received this month.</p>:
    <p>Add income records to calculate this insight.</p>}
   </Panel>
  </>;
 }

 function calendar(){
  const offset=new Date(year,month,1).getDay();
  const days=new Date(year,month+1,0).getDate();
  return <>
   {periodControls()}
   <Panel title="Financial calendar" sub="Select a date to see its expenses, income and scheduled bills.">
    <div className="af-calendar">
     {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><strong key={d}>{d}</strong>)}
     {Array.from({length:offset},(_,i)=><div key={"empty"+i}/>)}
     {Array.from({length:days},(_,i)=>{
      const d=`${monthPrefix}-${String(i+1).padStart(2,"0")}`;
      const total=sum(data.expenses.filter(e=>e.date===d));
      const inc=sum(data.income.filter(e=>e.date===d));
      const due=data.bills.some(b=>b.date===d);
      return <button key={d} onClick={()=>setSelected(d)}
       className={"af-day "+(selected===d?"selected ":"")+(total?"spend-day":"")}>
       <strong>{i+1}</strong>
       {total>0&&<small style={{color:"#B84A38"}}>{money(total)}</small>}
       {inc>0&&<small style={{color:"#117E78"}}>+{money(inc)}</small>}
       {due&&<small>Bill due</small>}
      </button>;
     })}
    </div>
   </Panel>
   <Panel title={selected}>
    {[...data.expenses.map(e=>({...e,kind:"Expense"})),...data.income.map(e=>({...e,kind:"Income"}))].filter(e=>e.date===selected).map(e=>
     <div className="af-record" key={e.id}>{e.kind}: {e.title}<strong>{money(amount(e))}</strong></div>)}
    {data.bills.filter(b=>b.date===selected).map(b=><div className="af-record" key={b.id}>Bill: {b.title}<strong>{money(b.amount)}</strong></div>)}
    <p>Total daily expenses: <strong>{money(sum(data.expenses.filter(e=>e.date===selected)))}</strong></p>
   </Panel>
  </>;
 }

 function categoriesPage(){
  return <Panel title="Expense categories">
   <form className="af-actions" onSubmit={e=>{
    e.preventDefault();
    const n=name.trim();
    if(n&&!data.categories.some(c=>c.toLowerCase()===n.toLowerCase())){
     append("categories",n);setName("");
    }
   }}>
    <input required placeholder="New category name" value={name} onChange={e=>setName(e.target.value)}/>
    <button className="af-primary">Add category</button>
   </form>
   {data.categories.map((c,i)=><div className="af-record" key={c}>
    <span><i className="af-dot" style={{background:palette[i%palette.length]}}/>{c}</span>
    <strong>{money(sum(monthExpenses.filter(e=>e.category===c)))}</strong>
   </div>)}
  </Panel>;
 }

 function budgets(){
  return <>
   <Panel title="Monthly spending budget">
    <form className="af-actions" onSubmit={e=>{
     e.preventDefault();setData(d=>({...d,budget:Number(budget)}));notify("Budget saved.");
    }}>
     <input required type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)}/>
     <button className="af-primary">Set budget</button>
    </form>
    <h1>{money(Number(data.budget)-spent)} remaining</h1>
    <p>{pct(spent,Number(data.budget))} used this month</p>
    <div className="af-track"><div style={{width:Math.min(100,data.budget?spent/data.budget*100:0)+"%",background:spent>data.budget?"#FF9566":"#24B4A7"}}/></div>
    {data.budget>0&&spent>data.budget&&<p className="af-warning">You have exceeded your monthly budget.</p>}
   </Panel>
   <Panel title="Category budgets">
    <form className="af-actions" onSubmit={e=>{
     e.preventDefault();setData(d=>({...d,categoryBudgets:{...d.categoryBudgets,[budgetCategory]:Number(categoryLimit)}}));setCategoryLimit("");
    }}>
     <Select options={data.categories} value={budgetCategory} onChange={e=>setBudgetCategory(e.target.value)}/>
     <input required type="number" min="1" placeholder="Monthly limit" value={categoryLimit} onChange={e=>setCategoryLimit(e.target.value)}/>
     <button className="af-primary">Save limit</button>
    </form>
    {Object.entries(data.categoryBudgets).map(([c,limit])=>{
     const used=sum(monthExpenses.filter(e=>e.category===c));
     return <div className="af-budget-row" key={c}>
      <div className="af-between"><strong>{c}</strong>{money(used)} / {money(limit)}</div>
      <div className="af-track"><div style={{width:Math.min(100,used/limit*100)+"%",background:used>limit?"#FF9566":"#24B4A7"}}/></div>
      <small>{pct(used,limit)} used {used>limit?"— Over budget":""}</small>
     </div>;
    })}
   </Panel>
  </>;
 }

 function goals(){
  return <>
   <Panel title="Create a savings goal">
    <form className="af-form" onSubmit={e=>{
     e.preventDefault();append("goals",{...goal,id:uid(),target:Number(goal.target),saved:Number(goal.saved||0)});setGoal({name:"",target:"",saved:""});
    }}>
     <label>Goal name<input required value={goal.name} onChange={e=>setGoal({...goal,name:e.target.value})}/></label>
     <label>Target amount<input required type="number" min="1" value={goal.target} onChange={e=>setGoal({...goal,target:e.target.value})}/></label>
     <label>Already saved<input type="number" min="0" value={goal.saved} onChange={e=>setGoal({...goal,saved:e.target.value})}/></label>
     <button className="af-primary">Create goal</button>
    </form>
   </Panel>
   <div className="af-grid">{data.goals.map(g=><Panel key={g.id} title={g.name}>
    <h1>{money(g.saved)}</h1><p>Target: {money(g.target)}</p>
    <div className="af-track"><div style={{width:Math.min(100,g.saved/g.target*100)+"%",background:"#D5AD57"}}/></div>
    <p>{pct(g.saved,g.target)} achieved</p>
    <button className="af-primary" onClick={()=>{
     const input=window.prompt("Enter additional savings in INR");
     const n=Number(input);
     if(Number.isFinite(n)&&n>0)setData(d=>({...d,goals:d.goals.map(x=>x.id===g.id?{...x,saved:round(x.saved+n)}:x)}));
    }}>Add savings</button>
    <button className="af-danger" onClick={()=>remove("goals",g.id)}>Delete</button>
   </Panel>)}</div>
   <p className="af-muted">Goals track allocations of savings, not additional income.</p>
  </>;
 }

 function recurring(){
  return <Panel title="Recurring bills" sub="Record scheduled monthly bills and manually mark them paid.">
   <form className="af-form" onSubmit={e=>{
    e.preventDefault();append("bills",{...bill,amount:Number(bill.amount),id:uid()});setBill({title:"",amount:"",date:today(),category:"Bills & Utilities"});
   }}>
    <label>Bill name<input required value={bill.title} onChange={e=>setBill({...bill,title:e.target.value})}/></label>
    <label>Amount in INR<input required type="number" min=".01" step=".01" value={bill.amount} onChange={e=>setBill({...bill,amount:e.target.value})}/></label>
    <label>Next due date<input required type="date" value={bill.date} onChange={e=>setBill({...bill,date:e.target.value})}/></label>
    <label>Category<Select options={data.categories} value={bill.category} onChange={e=>setBill({...bill,category:e.target.value})}/></label>
    <button className="af-primary">Schedule bill</button>
   </form>
   {data.bills.map(b=><div className="af-record" key={b.id}>
    <span><strong>{b.title}</strong><br/>{b.date} · {money(b.amount)} {b.date<today()?"· Overdue":""}</span>
    <div>
     <button className="af-primary" onClick={()=>{
      const [y,m,day]=b.date.split("-").map(Number);
      const end=new Date(y,m+1,0).getDate();
      const next=new Date(y,m,Math.min(day,end));
      setData(d=>({...d,
       expenses:[...d.expenses,{...fresh(),id:uid(),title:b.title,category:b.category,amount:b.amount,baseAmount:b.amount,date:today()}],
       bills:d.bills.map(x=>x.id===b.id?{...x,date:dateString(next)}:x)
      }));
      notify("Bill recorded and next due date scheduled.");
     }}>Mark paid</button>
     <button className="af-danger" onClick={()=>remove("bills",b.id)}>Delete</button>
    </div>
   </div>)}
  </Panel>;
 }

 function members(){
  return <Panel title="People and group members">
   <form className="af-actions" onSubmit={e=>{
    e.preventDefault();
    if(data.members.some(m=>m.name.toLowerCase()===name.trim().toLowerCase()))return notify("Member already exists.");
    if(name.trim())append("members",{id:uid(),name:name.trim()});
    setName("");
   }}>
    <input required placeholder="Member name" value={name} onChange={e=>setName(e.target.value)}/>
    <button className="af-primary">Add member</button>
   </form>
   {data.members.map(m=><div className="af-record" key={m.id}>
    <strong>{m.name}</strong>
    <span>{money(sum(data.expenses.filter(e=>e.memberId===m.id)))}</span>
    <button className="af-danger" onClick={()=>{
     if([...data.expenses,...data.income].some(e=>e.memberId===m.id||e.splits?.some(s=>s.memberId===m.id))||
      data.settlements.some(s=>s.from===m.id||s.to===m.id))
      return notify("Member is linked to financial records.");
     remove("members",m.id);
    }}>Delete</button>
   </div>)}
  </Panel>;
 }

 function settlements(){
  const balances=Object.fromEntries(data.members.map(m=>[m.id,0]));
  data.expenses.filter(e=>e.splits?.length).forEach(e=>{
   if(e.memberId in balances)balances[e.memberId]+=amount(e);
   e.splits.forEach(s=>{if(s.memberId in balances)balances[s.memberId]-=s.amount;});
  });
  data.settlements.forEach(s=>{
   if(s.from in balances)balances[s.from]+=s.amount;
   if(s.to in balances)balances[s.to]-=s.amount;
  });
  const debt=data.members.map(m=>({id:m.id,v:round(balances[m.id])})).filter(m=>m.v<0);
  const credit=data.members.map(m=>({id:m.id,v:round(balances[m.id])})).filter(m=>m.v>0);
  const suggestions=[];
  debt.forEach(d=>credit.forEach(c=>{
   const n=round(Math.min(-d.v,c.v));
   if(n>0){suggestions.push({from:d.id,to:c.id,amount:n});d.v=round(d.v+n);c.v=round(c.v-n);}
  }));
  return <>
   <Panel title="Who owes whom?" sub="Calculated from equal and custom shared expenses.">
    {data.members.map(m=><div className="af-record" key={m.id}>
     {m.name}<strong>{balances[m.id]>=0?"Receives ":"Owes "}{money(Math.abs(balances[m.id]))}</strong>
    </div>)}
    {suggestions.map((s,i)=><div className="af-record" key={i}>{memberName(s.from)} → {memberName(s.to)}<strong>{money(s.amount)}</strong></div>)}
    {!suggestions.length&&<p>No outstanding group balances.</p>}
   </Panel>
   <Panel title="Record a settlement">
    <form className="af-form" onSubmit={e=>{
     e.preventDefault();
     const n=Number(settle.amount);
     if(!settle.from||!settle.to||settle.from===settle.to||n<=0||
      n>Math.min(-(balances[settle.from]||0),balances[settle.to]||0))
      return notify("Choose a debtor, creditor and valid outstanding amount.");
     append("settlements",{...settle,id:uid(),amount:n,date:today()});notify("Settlement saved.");
    }}>
     {["from","to"].map(k=><label key={k}>{k}
      <Select value={settle[k]} onChange={e=>setSettle({...settle,[k]:e.target.value})} options={[{value:"",label:"Choose member"},...data.members.map(m=>({value:m.id,label:m.name}))]}/>
     </label>)}
     <label>Amount in INR<input required type="number" min=".01" step=".01" value={settle.amount} onChange={e=>setSettle({...settle,amount:e.target.value})}/></label>
     <button className="af-primary">Record settlement</button>
    </form>
    {data.settlements.map(s=><div className="af-record" key={s.id}>{memberName(s.from)} paid {memberName(s.to)} {money(s.amount)}<button className="af-danger" onClick={()=>remove("settlements",s.id)}>Delete</button></div>)}
   </Panel>
  </>;
 }

 function reports(){
  function exportCSV(){
   const escape=v=>{
    let s=String(v??"");
    if(/^[=+@-]/.test(s))s="'"+s;
    return '"'+s.replaceAll('"','""')+'"';
   };
   const rows=[["Type","Date","Title","Category","Amount","Currency","INR equivalent","Account","Payment method"]];
   [["Expense",data.expenses],["Income",data.income]].forEach(([kind,list])=>list.forEach(e=>rows.push([kind,e.date,e.title,e.category,e.amount,e.currency||"INR",amount(e),accountName(e.accountId),e.paymentMethod])));
   download("financial-report.csv",rows.map(r=>r.map(escape).join(",")).join("\n"),"text/csv");
  }
  return <>
   <Panel title="Reports and backup">
    <p>Download your financial records for personal use or spreadsheet analysis.</p>
    <div className="af-actions">
     <button className="af-primary" onClick={exportCSV}>Download CSV</button>
     <button className="af-primary" onClick={()=>download("expense-backup.json",JSON.stringify(data,null,2),"application/json")}>Download JSON backup</button>
     <button className="af-ghost" onClick={()=>window.print()}>Print report</button>
    </div>
    <label className="af-restore">Restore financial backup<input type="file" accept=".json,application/json" onChange={async e=>{
     const file=e.target.files[0];if(!file)return;
     try{
      if(file.size>5000000)throw new Error();
      const d=JSON.parse(await file.text());
      if(!d||!Array.isArray(d.expenses)||!Array.isArray(d.members)||
       d.expenses.some(t=>typeof t.title!=="string"||typeof t.date!=="string"||!Number.isFinite(Number(t.amount))||Number(t.amount)<=0))
       throw new Error();
      if(window.confirm("Replace current financial data with this backup?")){setData(normalize(d));notify("Backup restored.");}
     }catch{notify("Invalid backup file.");}
    }}/></label>
   </Panel>
   <Panel title={`${year} financial report`}>
    <p>Annual income: {money(sum(yearIncome))}</p>
    <p>Annual spending: {money(sum(yearExpenses))}</p>
    <p>Annual savings: {money(sum(yearIncome)-sum(yearExpenses))}</p>
    <Bars records={group(yearExpenses,"category")} total={sum(yearExpenses)}/>
   </Panel>
  </>;
 }

 const navigation=[
 ["Dashboard",LayoutDashboard],["Expenses",Receipt],
 ["Income",Banknote],["My Accounts",Landmark],
 ["Calendar",CalendarDays],["Analytics",ChartNoAxesCombined],
 ["Categories",Layers],["Budgets",Wallet],
 ["Savings Goals",Target],["Recurring Bills",Repeat],
 ["Members",Users],["Settlements",ArrowLeftRight],
 ["Reports",FileDown],["My Profile",UserRound]
 ];

 function content(){
  switch(page){
   case "Expenses":return transactionPage("expenses");
   case "Income":return transactionPage("income");
   case "My Accounts":return accountsPage();
   case "Calendar":return calendar();
   case "Analytics":return analytics();
   case "Categories":return categoriesPage();
   case "Budgets":return budgets();
   case "Savings Goals":return goals();
   case "Recurring Bills":return recurring();
   case "Members":return members();
   case "Settlements":return settlements();
   case "Reports":return reports();
   case "My Profile":return <Profile user={user} setUser={setUser} onLogout={onLogout}/>;
   default:return dashboard();
  }
 }

 return <div className="af-app">
  <aside className={"af-sidebar "+(menuOpen?"open":"")}>
   <div className="af-brand"><span><Wallet/></span><div>Expense Tracker<small>YOUR MONEY, REIMAGINED</small></div></div>
   
   {[
 ["OVERVIEW",["Dashboard","Calendar","Analytics"]],
 ["MANAGE MONEY",["Expenses","Income","My Accounts","Categories"]],
 ["FINANCIAL PLANNING",["Budgets","Savings Goals","Recurring Bills"]],
 ["SHARED FINANCES",["Members","Settlements"]],
 ["WORKSPACE",["Reports","My Profile"]]
].map(([group,pages])=>
 <div className="ec-nav-group" key={group}>
  <div className="ec-nav-heading">{group}</div>
  {navigation.filter(([n])=>pages.includes(n))
   .sort((a,b)=>pages.indexOf(a[0])-pages.indexOf(b[0]))
   .map(([n,Icon])=>
    <button key={n}
     className={page===n?"active":""}
     onClick={()=>navigate(n)}>
     <Icon size={18}/>{n}
    </button>
   )}
 </div>
)}
   <button onClick={onLogout}><LogOut size={18}/>Logout</button>
  </aside>
  <main className="af-main">
   <header className="af-header">
    <button className="af-mobile af-ghost" onClick={()=>setMenuOpen(!menuOpen)}><Menu/></button>
    <div><small>PERSONAL FINANCE / WORKSPACE</small><h1>{page}</h1></div>
    <button className="af-primary" onClick={()=>navigate("Expenses")}><Plus size={17}/>New expense</button>
   </header>
   {message&&<div className="af-message" role="status">{message}<button onClick={()=>setMessage("")}>×</button></div>}
   {content()}
  </main>
 </div>;
}




