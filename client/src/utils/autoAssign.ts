export const autoAssignPillarAndTags = async (question: string) => {
  const response = await fetch('/api/mentor-interest', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
};