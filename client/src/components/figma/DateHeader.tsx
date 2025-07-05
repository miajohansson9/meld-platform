import React from 'react';

interface DateHeaderProps {
  date: string;
  onDateChange: (date: string) => void;
}

const DateHeader: React.FC<DateHeaderProps> = ({ date, onDateChange }) => {
  const formatDisplayDate = (dateString: string) => {
    // Parse the date as local date to avoid timezone issues
    const inputDate = new Date(dateString + 'T00:00:00');
    
    // Get today's date in the same format for comparison
    const today = new Date();
    const todayString = (() => {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    if (dateString === todayString) {
      return 'Today';
    } else {
      return inputDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="text-center">
      <h2 className="font-serif text-xl text-meld-ink">{formatDisplayDate(date)}</h2>
    </div>
  );
};

export default DateHeader; 