const express = require("express");
const SMSGatewayRoutes = express.Router();

SMSGatewayRoutes.post('/send-sms', async (req, res) => {
  try {
    const { phone } = req?.body;
    
    if (!phone) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Phone number is required'
      });
    }

    const smsStatus = await fetch('https://login.esms.com.bd/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: 'Bearer 236|VQvXvt9s7VM7kkv43Ps90H2Ihtcgnxij9xQgmVMK'
      },
      body: JSON.stringify({
        recipient: "88" + phone,
        sender_id: "8809601003749",
        type: "plain",
        message: `Hotel Orion International
We truly appreciate your visit. It was a pleasure serving you`
      })
    });

    const smsData = await smsStatus.json();
    
    res.status(200).json({
      message: smsData?.status === 'success' ? 'SMS sent successfully' : 'SMS failed',
      success: smsData?.status === 'success',
      data: smsData
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Failed to send SMS',
      success: false,
      error: error.message
    });
  }
});

// Export the router properly
module.exports = SMSGatewayRoutes;