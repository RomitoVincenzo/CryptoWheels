import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Unbox from './components/Unbox';
import Garage from './components/Garage';
import Marketplace from './components/Marketplace'

const App = () => {
return (
<Router>
<Routes>
<Route exact path="/" element={<Home />}  />
<Route exact path="/unbox" element={<Unbox />}  />
<Route exact path="/garage" element={<Garage />}  />
<Route exact path="/marketplace" element={<Marketplace />} />
</Routes>
</Router>
);
};

export default App;