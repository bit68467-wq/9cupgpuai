import pool from "../db.js";

export const getUsers = async (req,res)=>{

 try{

  const result = await pool.query(
   "SELECT * FROM users"
  );

  res.json(result.rows);

 }catch(error){

  res.status(500).json({
   error:error.message
  });

 }

};

export const createUser = async (req,res)=>{

 const {name} = req.body;

 try{

  const result = await pool.query(
   "INSERT INTO users(name) VALUES($1) RETURNING *",
   [name]
  );

  res.json(result.rows[0]);

 }catch(error){

  res.status(500).json({
   error:error.message
  });

 }

};
