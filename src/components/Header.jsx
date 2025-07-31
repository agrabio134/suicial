import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';

export default function Header({ wallet, setWalletError, setWalletSuccess }) {
  const handleDisconnect = async () => {
    try {
      await wallet.disconnect();
      setWalletSuccess('Wallet disconnected successfully!');
    } catch (error) {
      setWalletError('Failed to disconnect wallet. Please try again.');
      console.error('Disconnect error:', error);
    }
  };

  return (
    <AppBar position="fixed">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: 2,
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SUICIAL
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {wallet.connected ? (
            <Button
              variant="contained"
              onClick={handleDisconnect}
              sx={{
                background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
                color: '#fff',
                borderRadius: 2,
                py: 1,
                fontSize: '0.9rem',
                '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0, 183, 255, 0.4)' },
              }}
            >
              Disconnect
            </Button>
          ) : (
            <ConnectButton
              sx={{
                background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
                color: '#fff',
                borderRadius: 2,
                py: 1,
                fontSize: '0.9rem',
                '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0, 183, 255, 0.4)' },
              }}
              onConnectSuccess={() => setWalletSuccess('Wallet connected successfully!')}
              onConnectError={() => setWalletError('Failed to connect wallet. Please try again.')}
            />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}