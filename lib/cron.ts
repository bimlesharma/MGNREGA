import cron from 'node-cron';
import { runETL } from './etl';

// Run ETL daily at 2 AM
export function setupCronJobs() {
  // Daily ETL job
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled ETL job...');
    try {
      await runETL();
      console.log('Scheduled ETL job completed');
    } catch (error) {
      console.error('Scheduled ETL job failed:', error);
    }
  });

  // Weekly full refresh on Sundays at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('Running weekly full ETL refresh...');
    try {
      await runETL(); // Fetch all available data
      console.log('Weekly ETL refresh completed');
    } catch (error) {
      console.error('Weekly ETL refresh failed:', error);
    }
  });

  console.log('Cron jobs scheduled');
}
