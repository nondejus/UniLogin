import React from 'react';
import {Link, BrowserRouter} from 'react-router-dom';
import {Route} from 'react-router';
import {ExamplePlayground} from './ExamplePlayground';
import {Web3PickerPlayground} from './Web3PickerPlayground';
import {EthersIframePlayground} from './EthersIframePlayground';

export const App = () => {
  return (
    <BrowserRouter>
      <div>
        <Link to="/chooser">Chooser</Link>
        <br />
        <Link to="/example">Example</Link>
        <br />
        <Link to="/ethers-iframe">Ethers.js iframe</Link>
      </div>
      <Route exact path="/example" component={ExamplePlayground} />
      <Route exact path="/chooser" component={Web3PickerPlayground} />
      <Route exact path="/ethers-iframe" component={EthersIframePlayground} />
    </BrowserRouter>
  );
};
