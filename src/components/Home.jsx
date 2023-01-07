import { LottiePlayer } from 'lottie-react';
import React from 'react';
import { Link } from 'react-router-dom';
import Navmenu from './includes/Navmenu';
import { Player, Controls } from '@lottiefiles/react-lottie-player';

const Home = () => {
return (
    <div style={{ backgroundColor: 'black' }} className='vh-100' >
      <Navmenu></Navmenu>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 col-md-6 col-12">
            <Player
              autoplay
              loop
              src="https://assets3.lottiefiles.com/packages/lf20_6q3x8d8e.json"
              style={{ height: '600px', width: '700px' }}
              className='img-fluid'
            >
            </Player>
          </div>
          <div className="col-lg-6 col-md-6 col-12 ">
            <h2 className="text-gold fw-bolder big-heading">
              CryptoWheels
            </h2>
            <p className='text-white fs-3'>
              Get a car, unbox new inventory items and customize your car
            </p>
            <button className='btn btn-app btn-lg'>
              Get Your Car Now
            </button>
          </div>
        </div>
      </div>
    </div>
);
};

export default Home;