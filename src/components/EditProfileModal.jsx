import React, { useState, useEffect } from 'react';
import { Box, Modal, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet, ConnectButton } from '@suiet/wallet-kit';
import axios from 'axios';

export default function EditProfileModal({ open, handleClose, db, wallet, setWalletError, setWalletSuccess, userData }) {
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);

  const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhMTNlMDlhMy1hYmJjLTQwOWYtOTdmMi1mNGY0N2Y2ODUzZDYiLCJlbWFpbCI6ImFncmFiaW9oYXJ2ZXlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImVmMzE5ZWU5ZjJiZTFmNDIxNGEyIiwic2NvcGVkS2V5U2VjcmV0IjoiNjJhNzVkZDY0MTM1YmIxNGNlNjNjNWVlOTk2MzgyOWQ3NWYwZmEzYzI2OTI2MmUyNTJmNTk0MDhiZTRhMzA1OCIsImV4cCI6MTc4NTQ3NDc1Mn0.4hFeV1P0I9D8bnic1m8JqJYG2OeQT4awDYPlmbsCNKw';

  useEffect(() => {
    if (open && userData) {
      setNickname(userData.nickname || '');
      setImagePreview(userData.profileImage || '');
      setProfileImage(null); // Reset file input
    } else {
      setNickname('');
      setProfileImage(null);
      setImagePreview('');
    }
  }, [open, userData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setWalletError('Image size must be less than 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setWalletError('Please upload a valid image file.');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVerify = async () => {
    if (!wallet.connected) {
      setWalletError('Please connect your wallet first!');
      return;
    }
    setIsVerifying(true);
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [2_000_000_000]); // 2 SUI
      tx.transferObjects([coin], '0x5c1f8fdeb920041285d97098593c26358ba9fba799aeee8ed108b4e2ff0c2a5b');
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
        chain: 'sui:mainnet',
      });
      if (result) {
        await setDoc(
          doc(db, 'users', wallet.account.address),
          { verified: true },
          { merge: true }
        );
        setWalletSuccess('Profile verified successfully!');
      }
    } catch (error) {
      setWalletError('Failed to verify profile. Ensure sufficient SUI balance and try again.');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      setWalletError('Please connect your wallet first!');
      return;
    }
    setLoading(true);
    try {
      let profileImageUrl = imagePreview; // Keep existing image if no new upload
      if (profileImage) {
        const formData = new FormData();
        formData.append('file', profileImage);
        formData.append('pinataMetadata', JSON.stringify({
          name: `profile_${wallet.account.address}`,
          keyvalues: { userAddress: wallet.account.address },
        }));
        formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

        try {
          const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
              Authorization: `Bearer ${PINATA_JWT}`,
              'Content-Type': 'multipart/form-data',
            },
          });

          if (response.data.IpfsHash) {
            profileImageUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
          } else {
            throw new Error('No IPFS hash returned from Pinata');
          }
        } catch (uploadError) {
          console.error('Pinata upload error:', uploadError.response?.data || uploadError.message);
          setWalletError('Failed to upload image to Pinata. Profile will be updated without an image.');
        }
      }

      await setDoc(
        doc(db, 'users', wallet.account.address),
        {
          nickname: nickname.trim() || wallet.account.address.slice(0, 6),
          profileImage: profileImageUrl,
        },
        { merge: true }
      );
      setWalletSuccess('Profile updated successfully!');
      setNickname('');
      setProfileImage(null);
      setImagePreview('');
      handleClose();
    } catch (error) {
      setWalletError('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          bgcolor: 'rgba(30, 30, 30, 0.95)',
          border: '2px solid #00b7ff',
          boxShadow: '0 12px 32px rgba(0, 183, 255, 0.5)',
          borderRadius: 4,
          p: 3,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#ffffff' }}>
          Edit Profile
        </Typography>
        {!wallet.connected ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2, color: '#ffffff' }}>
              Please connect your wallet to edit your profile.
            </Typography>
            <ConnectButton
              sx={{
                background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
                color: '#fff',
                borderRadius: 2,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0, 183, 255, 0.4)' },
              }}
              onConnectSuccess={() => setWalletSuccess('Wallet connected successfully!')}
              onConnectError={() => setWalletError('Failed to connect wallet. Please try again.')}
            />
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ mt: 2, width: '100%' }}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Upload Profile Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 8,
                    border: '2px solid #00b7ff',
                  }}
                />
              </Box>
            )}
            <Button
              variant="contained"
              fullWidth
              onClick={handleVerify}
              disabled={isVerifying}
              sx={{ mb: 2 }}
            >
              {isVerifying ? <CircularProgress size={24} /> : 'Verify Profile (2 SUI)'}
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ flex: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClose}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </form>
        )}
      </Box>
    </Modal>
  );
}