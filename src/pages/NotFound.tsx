import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img src="/aisi-logo-color.svg" alt="ENSIA Logo" className="h-20 w-auto mx-auto mb-12 opacity-50 grayscale" />

          <div className="relative inline-block">
            <h1 className="text-9xl md:text-[12rem] font-display font-black text-foreground/5 tracking-tighter leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-foreground">
                Lost in space.
              </h2>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-6"
        >
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            The page you are looking for has been moved, deleted, or never existed in this dimension.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/projects">
              <Button className="rounded-full px-8 py-6 h-auto shadow-lg shadow-primary/20 gap-2 font-bold">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-full px-8 py-6 h-auto bg-transparent gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Return Back
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 flex items-center justify-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground">
            AISI SYSTEM STATUS: OPERATIONAL
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
