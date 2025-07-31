import React from 'react';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, Person, Leaderboard } from '@mui/icons-material';

export default function BottomNav({ navigate, setOpenPostModal, wallet }) {
  const handleProfileClick = () => {
    if (wallet?.connected && wallet?.account?.address) {
      navigate(`/profile/${wallet.account.address}`);
    } else {
      // Optionally handle the case when wallet is not connected
      console.warn('Wallet not connected. Cannot navigate to profile.');
      // You can also trigger an error message or prompt wallet connection
      // e.g., setWalletError('Please connect your wallet to view your profile.');
    }
  };

  return (
    <BottomNavigation
      showLabels={false}
      sx={{ position: 'fixed', bottom: 0, width: '100%' }}
    >
      <BottomNavigationAction
        icon={<Home />}
        onClick={() => navigate('/')}
        className='button_nav_icon'
      />
      <BottomNavigationAction
        icon={<Leaderboard />}
        onClick={() => navigate('/leaderboard')}
        className='button_nav_icon'
      />
      <BottomNavigationAction
        icon={<Person />}
        onClick={handleProfileClick}
        className='button_nav_icon'
      />
    </BottomNavigation>
  );
}