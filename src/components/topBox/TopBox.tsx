import "./topBox.scss"
import {topDealUsers} from "../../data.ts" 
export const TopBox = () => {
  return (
    <div className="topBox">
        {/* the details of the topbox will be the deals 
         and since there can be many, we will keep those datas in the data.ts instead of creating multiple lists 
         */}
        <h1>Top Deals</h1>
        <div className="list">
            {topDealUsers.map(user=>(
                <div className="listItem" key={user.id}>
                    <div className="user">
                        <img src={user.img} alt="" />
                    
                    <div className="userTexts">
                        <span className="username">{user.username}</span>
                        <span className="email">{user.email}</span>
                    </div>
                    </div>
                    <div className="amount">${user.amount}</div>
                </div>
            )
            )}
        </div>
    </div>
  )
}
