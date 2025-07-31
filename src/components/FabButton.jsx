import React from 'react';
import { Fab, Box } from '@mui/material';
import { Add } from '@mui/icons-material';

export default function FabButton({ setOpenPostModal }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 70, md: 30 },
        right: 30,
        zIndex: 1000,
      }}
    >
      <Fab
        color="primary"
        onClick={() => setOpenPostModal(true)}
        sx={{
          background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
          color: '#ffffff',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 8px 24px rgba(0, 183, 255, 0.6)',
          },
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
}