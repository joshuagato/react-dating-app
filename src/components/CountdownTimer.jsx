import { useState, useEffect } from 'react';

const CountdownTimer = ({ counting, setCounting }) => {
//   const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes = 300 seconds
  const [secondsLeft, setSecondsLeft] = useState(7);

  useEffect(() => {
    // Exit early if the timer has reached 0
    if (secondsLeft <= 0) return setCounting(false);

    // Set up the interval to decrement every second
    const intervalId = setInterval(() => {
      setSecondsLeft((prevSeconds) => prevSeconds - 1);
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [secondsLeft]);

  // Format the time into MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div style={styles.container} className='fade-in'>
      {counting && <h1 style={styles.timerText}>{formattedTime}</h1>}
      {/* {secondsLeft === 0 && <p style={styles.alertText}>Time's up!</p>} */}
    </div>
  );
};

// Basic inline styling for presentation
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50px',
    fontFamily: 'sans-serif',
  },
  timerText: {
    fontSize: '4rem',
    margin: '0',
  },
  alertText: {
    color: 'red',
    fontSize: '1.2rem',
    marginTop: '1rem',
  }
};

export default CountdownTimer;
