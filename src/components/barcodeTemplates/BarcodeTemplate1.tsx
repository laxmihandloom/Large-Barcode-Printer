import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

const BarcodeTemplate1 = ({ itemName, value, rate, mrp, sizeLabel, sizeCode, age, uniqueCode, sku }: any) => {
  const barcodeRef = useRef(null);
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, value, {
        format: 'CODE128',
        displayValue: false,
        width: 3.5,
        height: 83,
        margin: 0
      });
    }
  }, [value]);
  const discountPercentage = mrp && rate ? Math.round(((mrp - rate) / mrp) * 100) : 0;

  return (
    <Box
      width="400px"
      height="600px"
      sx={{
        fontFamily: 'Arial',
        paddingLeft: '15px',
        paddingRight: '15px',
        paddingTop: '17px',
        paddingBottom: '5px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      {/* Item Name */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{
          color: '#000000',
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: '36px',
          lineHeight: '100%',
          letterSpacing: '0%',
          textAlign: 'center',
          marginBottom: '4px'
        }}>
          {itemName.split(' ').slice(0, 2).join(' ').toUpperCase()}
        </Typography>
        <Typography sx={{
          color: '#000000',
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: '36px',
          lineHeight: '100%',
          letterSpacing: '0%',
          textAlign: 'center'
        }}>
          {itemName.split(' ').slice(2).join(' ').toUpperCase()}
        </Typography>
      </Box>

      {/* Border below item name */}
      <Box sx={{
        borderTop: '4px solid #000000',
        width: '370px',
        height: '0px',
        opacity: 1,
      }} />

      {/* SIZE and AGE on same line */}
      <Box sx={{ margin: '0 15px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {/* SIZE Box */}
        <Box sx={{
          width: '125px',
          height: '70px',
          border: '4px solid #000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <Typography sx={{
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '14px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center'
          }}>
            SIZE
          </Typography>
          <Box sx={{
            width: '125px',
            height: '0px',
            borderTop: '4px solid #000000',
            marginTop: '4px'
          }} />
          <Typography sx={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginTop: '4px',
            textAlign: 'center'
          }}>
            {sizeLabel?.split('·')[1]?.trim() || 'S'}
          </Typography>
        </Box>

        {/* AGE Box */}
        <Box sx={{
          width: '125px',
          height: '70px',
          border: '4px solid #000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <Typography sx={{
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '14px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center'
          }}>
            AGE
          </Typography>
          <Box sx={{
            width: '125px',
            height: '0px',
            borderTop: '4px solid #000000',
            marginTop: '4px'
          }} />
          <Typography sx={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginTop: '4px',
            textAlign: 'center'
          }}>
            {age || '1-2 Yrs'}
          </Typography>
        </Box>
      </Box>

      {/* Original Price and Discount */}
      <Box sx={{
        width: '346px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Original Price Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography sx={{
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center'
          }}>
            ORIGINAL PRICE
          </Typography>
          <Typography sx={{
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: '36px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center',
            textDecoration: 'line-through'
          }}>
            ₹{mrp}
          </Typography>
        </Box>

        {/* Discount Badge */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          border: '2.5px solid #000000',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography sx={{
            color: 'white',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '32px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center',
            verticalAlign: 'middle'
          }}>
            {discountPercentage}%
          </Typography>
        </Box>
      </Box>

      {/* Sale Price Box */}
      <Box sx={{
        width: '346px',
        height: '98px',
        border: '4px solid #000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px',
        margin: '0 auto'
      }}>
        <Box sx={{
          width: '335px',
          height: '88px ',
          backgroundColor: '#000000',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography sx={{
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '24px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center',
            color: 'white',
            marginBottom: '8px'
          }}>
            SALE PRICE
          </Typography>
          <Typography sx={{
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '48px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center',
            color: 'white'
          }}>
            ₹{rate}
          </Typography>
        </Box>
      </Box>

      {/* Barcode Section Main Container */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* SKU/Product Code */}
        <Typography sx={{
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: '20px',
          lineHeight: '100%',
          letterSpacing: '0%',
          textAlign: 'center',
          color: '#000000',
          marginTop: '8px'
        }}>
          {uniqueCode || value}
        </Typography>

        {/* Barcode */}
        <Box sx={{ 
          textAlign: 'center',
          width: '371px',
          height: '84px',
          marginTop: '2px',
          marginBottom: '2px'
        }}>
          <svg 
            ref={barcodeRef} 
            width="100%" 
            height="100%"
          />
        </Box>

        {/* Code below barcode */}
        <Typography sx={{
          fontFamily: 'Arial',
          fontWeight: 700,
          fontSize: '24px',
          lineHeight: '100%',
          letterSpacing: '0%',
          textAlign: 'center',
          color: '#000000',
        }}>
          {sku}
        </Typography>
      </Box>
    </Box>
  );
};

export default BarcodeTemplate1;