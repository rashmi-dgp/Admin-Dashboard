import "./navbar.scss"
 const Navbar = () => {
  return (
    <div className="navbar">
        <div className="logo">
            <img src="logo.svg" alt="logo" />
            <span>rashmi_admin</span>
        </div>
        <div className="icons">
            <img src="/search.svg" alt="" className="icons" />
            <img src="/app.svg" alt="" className="icons" />
            <img src="/expand.svg" alt="" className="icons" />
            <div className="notification">
                <img src="/notifications.svg" alt="" />
                <span>1</span>
            </div>
            <div className="user">
                <img src="https://plus.unsplash.com/premium_photo-1661763150703-149671deb82c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGhvdG98ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60" alt="" />
                <span>Rashmi</span>
            </div>

            <img src="/settings.svg" alt="" className="icons" />
        </div>
    </div>
  )
}

export default Navbar
