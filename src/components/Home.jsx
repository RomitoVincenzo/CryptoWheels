import React from 'react';
import { Link } from 'react-router-dom';
import { Nav, Navbar } from 'react-bootstrap';

const Home = () => {
return (
    <div style={{ backgroundColor: 'gray' }} >
      <Navbar style={{ fontSize: "2.5rem" }} fixed="top" bg="dark" variant="dark" expand="sm">
        <Navbar.Brand style={{ fontSize: "2.5rem", marginLeft: "1rem" }} href="/">Home</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link style={{ marginLeft: "1rem" }} href="/unbox">Unbox</Nav.Link>
            <Nav.Link style={{ marginLeft: "1rem" }} href="/garage">Garage</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
);
};

export default Home;