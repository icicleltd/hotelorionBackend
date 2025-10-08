const cron = require('node-cron');
const Bookings = require('../models/bookingsModel');

// Function to check and update late checkouts
const checkLateCheckouts = async () => {
    try {
        const today = new Date();
        const todayFormatted = today.toISOString().split("T")[0];
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        console.log(`[${new Date().toLocaleString()}] Running late checkout check...`);
        console.log(`Current time: ${currentTime}`);

        // Find all bookings checking out today that haven't been marked as late checkout yet
        const todayCheckouts = await Bookings.find({
            lastDate: todayFormatted,
            checkoutStatus: { $nin: ["Late CheckOut", "Early CheckOut"] },
            isRegistered: true
        });

        console.log(`Found ${todayCheckouts.length} bookings to check`);

        let updatedCount = 0;

        for (const booking of todayCheckouts) {
            // First, update the checkout time to current time
            await Bookings.findByIdAndUpdate(booking._id, {
                checkOutTime: currentTime
            });

            console.log(`Booking ${booking.bookingId} - Updated checkout time to ${currentTime}`);

            // Then check if current time is after 2 PM (14:00)
            if (currentHour >= 14) {
                // Calculate late checkout charge (50% of room rent)
                const lateCheckoutCharge = booking.roomRent * 0.5;

                // Update the booking with late checkout status and charge
                await Bookings.findByIdAndUpdate(booking._id, {
                    checkoutStatus: "Late CheckOut",
                    $inc: { dueAmount: lateCheckoutCharge }
                });

                updatedCount++;
                console.log(`✓ Booking ${booking.bookingId} marked as Late CheckOut. Added charge: ${lateCheckoutCharge} Taka`);
            } else {
                console.log(`○ Booking ${booking.bookingId} - No late charge (current time ${currentTime} is before 2 PM)`);
            }
        }

        console.log(`Late checkout check completed. Updated ${updatedCount} bookings with late checkout status.`);
    } catch (error) {
        console.error('Error in late checkout check:', error);
    }
};

// Schedule cron jobs
const initCronJobs = () => {
    // Run daily at 12:00 PM
    cron.schedule('0 12 * * *', () => {
        console.log('Running scheduled late checkout check at 12:00 PM');
        checkLateCheckouts();
    });

    // Run daily at 2:00 PM as well (to catch any changes)
    cron.schedule('0 14 * * *', () => {
        console.log('Running scheduled late checkout check at 2:00 PM');
        checkLateCheckouts();
    });

    // check every hour from 2 PM to 11 PM
    cron.schedule('0 14-23 * * *', () => {
        console.log('Running scheduled late checkout check on the hour from 2 PM to 11 PM');
        checkLateCheckouts();
    });

    // check 2:05 PM
    cron.schedule('5 14 * * *', () => {
        console.log('Running scheduled late checkout check at 2:10 PM');
        checkLateCheckouts();
    });
    // check 2:10 PM
    cron.schedule('10 14 * * *', () => {
        console.log('Running scheduled late checkout check at 2:10 PM');
        checkLateCheckouts();
    });

    // check 2: 20 PM
    cron.schedule('20 14 * * *', () => {
        console.log('Running scheduled late checkout check at 2:20 PM');
        checkLateCheckouts();
    });

    // check 10:45 PM
    cron.schedule('58 22 * * *', () => {
        console.log('Running scheduled late checkout check at 10:45 PM');
        checkLateCheckouts();
    });

    // TESTING ONLY - Remove after testing
    // cron.schedule('* * * * *', () => {
    //     console.log('Running test - checking every minute');
    //     checkLateCheckouts();
    // });

    console.log('Cron jobs initialized successfully');
};

module.exports = { initCronJobs, checkLateCheckouts };