import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

import Menu from './components/Menu';

import Login from './components/Login';
import Join from './components/Join';
import HomeFeed from './components/HomeFeed';
import FeedDetail from './components/FeedDetail';
import CreateFeed from './components/CreateFeed';
import Explore from './components/Explore';
import Profile from './components/Profile';
import ProfileSettings from './components/ProfileSettings';
import Chat from './components/Chat';
import BusinessBoost from './components/BusinessBoost';
import Notifications from './components/Notifications';

function App() {
  const location = useLocation();

  const isAuthPage = location.pathname === '/' || location.pathname === '/join';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {!isAuthPage && <Menu />}

      <Box component="main" sx={{ flexGrow: 1, p: isAuthPage ? 0 : 0 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />

          <Route path="/home" element={<HomeFeed />} />
          <Route path="/feed/new" element={<CreateFeed />} />
          <Route path="/feed/detail" element={<FeedDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile/:userNo" element={<Profile />} />
          <Route path="/profile/settings" element={<ProfileSettings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/business" element={<BusinessBoost />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;