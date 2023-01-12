import React from 'react'
import { Nav, Navbar } from 'react-bootstrap';
import logo from '../../../assets/images/logo.png';
import logoCW from '../../../assets/images/logo_cryptowheels.png';
import CustomCss from "../../../css/custom.css";
import * as Icon from 'react-bootstrap-icons';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";


const Navmenu = () => {
  return (
    <Navbar style={{ fontSize: "1rem",background:"#0B0F3F", }} bg="" variant="dark" expand="sm">
        <NavLink to="/" style={{ fontSize: "1.5rem", marginLeft: "1rem" }} className="navbar-brand text-gold fw-bold">
            <img
                src={logoCW}
                width="30"
                height="30"
                className="d-inline-block me-1"
                alt="Cryptowheels Logo"
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
            <NavLink style={{ marginLeft: "1rem" }} to="/marketplace" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon.Shop className='me-2 nav-icon'></Icon.Shop>
              Marketplace
            </NavLink>
          </Nav>
        </Navbar.Collapse>
       
    </Navbar>
    
  )
}

export default Navmenu;