// src/routes.js
import React from 'react'
import { Route, IndexRoute } from 'react-router'
import Layout from './components/Layout';
import IndexPage from './components/IndexPage';
import NotFoundPage from './components/NotFoundPage';
import Chat from './components/Chat';
import PrivacyPolicy from './components/PrivacyPolicy';

const routes = (
  <Route path="/" component={Layout}>
    <IndexRoute component={Chat}/>
    <Route path="chat" component={Chat}/>
    <Route path="privacy_policy" component={PrivacyPolicy}/>
    <Route path="*" component={NotFoundPage}/>
  </Route>
);

export default routes;
