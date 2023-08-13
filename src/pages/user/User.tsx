// import React from 'react'
import "./user.scss"
import { singleUser } from "../../data"
import  Single  from "../../components/single/Single"
const User = () => {
  return (
    <div className="user">
        <Single{...singleUser }/>
    </div>
  )
}

export default User
