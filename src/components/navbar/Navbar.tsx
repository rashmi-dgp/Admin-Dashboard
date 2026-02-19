import "./navbar.scss";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="logo">
        <img src="/logo.svg" alt="logo" />
        <span>Productivity Tracker</span>
      </div>
      <div className="icons">
        <div className="user">
          <img
            src="https://plus.unsplash.com/premium_photo-1661763150703-149671deb82c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGhvdG98ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
            alt=""
          />
          <span>Rashmi</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
