import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
return (
<div>
<h1>Home</h1>
<Link to="/unbox">
<button>Unbox</button>
</Link>
<Link to="/garage">
<button>Garage</button>
</Link>
</div>
);
};

export default Home;