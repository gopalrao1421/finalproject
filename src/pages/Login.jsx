import {useState} from "react";
import {
 Wallet, ArrowLeft, ArrowRight, Mail,
 LockKeyhole, Eye, EyeOff, UserRound,
 ShieldCheck, TrendingUp, Target,
 CreditCard, Sparkles, LoaderCircle
} from "lucide-react";

import {login,register} from "../utils/unifiedAuth";
import "../styles/orbit.css";

export default function Login({onLogin,onBack}){
 const [signup,setSignup]=useState(false);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [visible,setVisible]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 async function submit(e){
  e.preventDefault();
  setBusy(true);
  setError("");

  try{
   const user=signup
    ?await register(name,email,password)
    :await login(email,password);

   onLogin(user);
  }catch(err){
   setError(err.message||"Unable to sign in.");
  }finally{
   setBusy(false);
  }
 }

 function changeMode(value){
  setSignup(value);
  setError("");
  setPassword("");
 }

 return <main className="orbit-auth">

  <div className="orbit-background" aria-hidden="true">
   <div className="orbit-glow glow-one"/>
   <div className="orbit-glow glow-two"/>
   <div className="orbit-glow glow-three"/>
   <div className="orbit-grid"/>

   {Array.from({length:24},(_,i)=>
    <i className="orbit-star" key={i}
     style={{
      left:(i*37%100)+"%",
      top:(i*23%100)+"%",
      animationDelay:(i*.35)+"s"
     }}/>
   )}
  </div>

  <nav className="orbit-nav">
   <div className="orbit-brand">
    <span><Wallet size={23}/></span>
    Expense Tracker
   </div>

   <button className="orbit-home" onClick={onBack}>
    <ArrowLeft size={16}/> Homepage
   </button>
  </nav>

  <div className="orbit-floating float-one" aria-hidden="true">
   <TrendingUp color="#67E1D1" size={25}/>
   <div>
    <small>BUILD BETTER HABITS</small>
    <strong>Grow your savings</strong>
   </div>
  </div>

  <div className="orbit-floating float-two" aria-hidden="true">
   <CreditCard color="#A88BFF" size={26}/>
   <div>
    <small>STAY IN CONTROL</small>
    <strong>Track every expense</strong>
   </div>
  </div>

  <div className="orbit-floating float-three" aria-hidden="true">
   <Target color="#C9F875" size={26}/>
   <div>
    <small>YOUR NEXT MILESTONE</small>
    <strong>Achieve your goals</strong>
   </div>
  </div>

  <section className="orbit-center">

   <div className="orbit-planet" aria-hidden="true">
    <div className="orbit-ring ring-one">
     <span className="orbit-satellite satellite-one">%</span>
    </div>

    <div className="orbit-ring ring-two">
     <span className="orbit-satellite satellite-two">$</span>
    </div>

    <div className="orbit-ring ring-three">
     <span className="orbit-satellite satellite-three">+</span>
    </div>

    <div className="orbit-coin">₹</div>
   </div>

   <div className="orbit-intro">
    <span className="orbit-eyebrow">
     <Sparkles size={13}/> YOUR FINANCIAL UNIVERSE
    </span>

    <h1>Your money. <em>In balance.</em></h1>

    <p>A smarter financial future begins here.</p>
   </div>

   <article className="orbit-card">

    <div className="orbit-tabs">
     <button type="button"
      disabled={busy}
      className={!signup?"selected":""}
      onClick={()=>changeMode(false)}>
      Sign in
     </button>

     <button type="button"
      disabled={busy}
      className={signup?"selected":""}
      onClick={()=>changeMode(true)}>
      Create account
     </button>
    </div>

    <form onSubmit={submit}
     className="orbit-form" key={String(signup)}>

     {signup&&<label>Full name
      <div className="orbit-input">
       <UserRound size={19}/>
       <input required value={name}
        autoComplete="name"
        placeholder="Enter your name"
        onChange={e=>setName(e.target.value)}/>
      </div>
     </label>}

     <label>Email address
      <div className="orbit-input">
       <Mail size={19}/>
       <input required type="email"
        value={email}
        autoComplete="email"
        placeholder="you@example.com"
        onChange={e=>setEmail(e.target.value)}/>
      </div>
     </label>

     <label>Password
      <div className="orbit-input">
       <LockKeyhole size={19}/>
       <input required
        type={visible?"text":"password"}
        minLength={signup?8:undefined}
        autoComplete={signup?"new-password":"current-password"}
        value={password}
        placeholder={signup?"At least 8 characters":"Enter your password"}
        onChange={e=>setPassword(e.target.value)}/>

       <button type="button"
        aria-label={visible?"Hide password":"Show password"}
        onClick={()=>setVisible(!visible)}>
        {visible?<EyeOff size={19}/>:<Eye size={19}/>}
       </button>
      </div>
     </label>

     {error&&<div role="alert" className="orbit-error">{error}</div>}

     <button type="submit"
      disabled={busy}
      className="orbit-submit">

      {busy?<LoaderCircle className="orbit-spinner" size={20}/>:null}

      {busy?"Please wait...":signup?
       "Begin my journey":"Enter my workspace"}

      {!busy&&<ArrowRight size={19}/>}
     </button>

    </form>

    <div className="orbit-card-footer">
     Your financial journey, on your terms.
    </div>

   </article>

   <div className="orbit-trust">
    <span><ShieldCheck size={16}/> Local expense records</span>
    <span><Wallet size={16}/> No bank connection</span>
   </div>

  </section>

  <footer className="orbit-footer">
   Expense Tracker · Designed for smarter financial decisions
  </footer>

 </main>;
}
