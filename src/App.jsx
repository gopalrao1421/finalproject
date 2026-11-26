import "./styles/eclipse.css";
import {useState} from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

import Finance from "./pages/Finance";

import {getSession,logout} from "./utils/auth";

import "./styles/global.css";
import "./styles/auth.css";
import "./styles/redesign.css";

export default function App(){

 const [user,setUser]=useState(getSession);
 const [entered,setEntered]=useState(false);

 

 function resetLocation(){
  window.history.replaceState(null,"","/");
  window.scrollTo(0,0);
 }

 function handleLogout(){
  logout();
  setUser(null);
  setEntered(false);
  resetLocation();
 }

 if(user){
  return <Finance
   key={user.id}
   user={user}
   setUser={setUser}
   onLogout={handleLogout}
  />;
 }

 if(!entered){
  return <Landing onStart={()=>{
   setEntered(true);
   resetLocation();
  }}/>;
 }

 return <Login
  onLogin={account=>{
   setUser(account);
   resetLocation();
  }}
  onBack={()=>{
   setEntered(false);
   resetLocation();
  }}
 />;
}


