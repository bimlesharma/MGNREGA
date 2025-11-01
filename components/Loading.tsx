'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <motion.div
            className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 w-16 h-16 border-4 border-secondary/20 border-b-secondary rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.div
          className="flex flex-col items-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="text-foreground font-medium">Loading data</p>
          <p className="text-muted-foreground text-sm">Please wait while we fetch the latest information</p>
        </motion.div>
      </div>
    </div>
  );
}
