require('dotenv').config();
const express=require('express');
const helmet=require('helmet');
const rateLimit=require('express-rate-limit');
const {Pool}=require('pg');
const path=require('path');
const app=express();
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'12kb'}));
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:false}:undefined}):null;
let dbReady=false;
async function setup(){if(!pool){console.warn('DATABASE_URL not set. Contact form unavailable.');return}try{await pool.query(`CREATE TABLE IF NOT EXISTS messages (id BIGSERIAL PRIMARY KEY,name VARCHAR(100) NOT NULL,email VARCHAR(254) NOT NULL,message TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);dbReady=true;console.log('Database ready.')}catch(err){console.error('Database initialization failed:',err.message)}}
app.get('/api/health',(req,res)=>res.json({status:'ok',database:dbReady?'connected':'unavailable'}));
app.post('/api/contact',rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:'draft-7',legacyHeaders:false}),async(req,res)=>{
  const {name,email,message}=req.body||{};
  if(typeof name!=='string'||typeof email!=='string'||typeof message!=='string'||name.trim().length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||message.trim().length<10||message.length>3000)return res.status(400).json({error:'Please enter a valid name, email, and message (at least 10 characters).'});
  if(!dbReady)return res.status(503).json({error:'Contact form is not ready. Database setup is required.'});
  try{await pool.query('INSERT INTO messages (name,email,message) VALUES ($1,$2,$3)',[name.trim(),email.trim(),message.trim()]);res.status(201).json({success:true})}catch(err){console.error('Message save failed:',err.message);res.status(500).json({error:'Unable to send your message right now.'})}
});
const dist=path.join(__dirname,'../frontend/dist');app.use(express.static(dist));app.get('*',(req,res)=>res.sendFile(path.join(dist,'index.html')));
const port=Number(process.env.PORT)||10000;
setup().finally(()=>app.listen(port,'0.0.0.0',()=>console.log(`Server listening on ${port}`)));
