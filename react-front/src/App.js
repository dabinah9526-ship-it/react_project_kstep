import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

import Menu from './components/Menu';
import LanguageToggle from './components/LanguageToggle';

import Login from './components/Login';
import Join from './components/Join';
import HomeFeed from './components/HomeFeed';
import FeedDetail from './components/FeedDetail';
import CreateFeed from './components/CreateFeed';
import Explore from './components/Explore';
import Profile from './components/Profile';
import ProfileSettings from './components/ProfileSettings';
import Chat from './components/Chat';
import Notifications from './components/Notifications';
import StoryManage from "./components/StoryManage";
import AdDetail from "./components/AdDetail";
import SavedList from "./components/SavedList";
import FindAccount from "./components/FindAccount";

function App() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/' ||
    location.pathname === '/join' ||
    location.pathname === '/find-account';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <LanguageToggle />

      {!isAuthPage && <Menu />}

      <Box component="main" sx={{ flexGrow: 1, p: isAuthPage ? 0 : 0 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/find-account" element={<FindAccount />} />

          <Route path="/home" element={<HomeFeed />} />
          <Route path="/feed/new" element={<CreateFeed />} />
          <Route path="/feed/detail" element={<FeedDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile/:userNo" element={<Profile />} />
          <Route path="/profile/settings" element={<ProfileSettings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/story/manage" element={<StoryManage />} />
          <Route path="/ad/detail/:adNo" element={<AdDetail />} />
          <Route path="/saved" element={<SavedList />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;