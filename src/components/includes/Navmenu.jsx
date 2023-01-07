import React from 'react'
import { Nav, Navbar } from 'react-bootstrap';
import logo from '../../../assets/images/logo.png';
import CustomCss from "../../../css/custom.css";
import * as Icon from 'react-bootstrap-icons';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";


const Navmenu = () => {
  return (
    <Navbar style={{ fontSize: "1rem",background:"#0B0F3F", }} bg="" variant="dark" expand="sm">
        <NavLink to="/" style={{ fontSize: "1.5rem", marginLeft: "1rem" }} className="navbar-brand">
            <img
                src={logo}
                width="35"
                height="35"
                className="d-inline-block me-1"
                alt="React Bootstrap logo"
            />
            CryptoWheels
        </NavLink>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <NavLink style={{ marginLeft: "1rem" }} to="/unbox" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon.Gift className='me-2 nav-icon'></Icon.Gift>
              Unbox
            </NavLink>
            <NavLink style={{ marginLeft: "1rem" }} to="/garage" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon.CarFront className='me-2 nav-icon'></Icon.CarFront>
              Garage
            </NavLink>
          </Nav>
        </Navbar.Collapse>
       
    </Navbar>
    
  )
}

export default Navmenu;