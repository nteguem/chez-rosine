function getRandomDelay(minDelay, maxDelay) {
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  function simulateTyping(chat, intervalInSeconds) {
    chat.sendStateTyping(); // Initial typing state
  
    // Set an interval to resend the typing state at the specified interval
    const intervalId = setInterval(() => {
      chat.sendStateTyping(); // Resend typing state
    }, intervalInSeconds * 1000);
  
    // Return the interval ID so it can be cleared if needed
    return intervalId;
  }
  
  module.exports = {getRandomDelay,simulateTyping};
