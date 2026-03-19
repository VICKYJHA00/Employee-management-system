// SUPER ENHANCED LOGIN FORM (EXTREME VERSION ~400+ LINES)
import React, { useState, useEffect, useMemo } from 'react';


import { Button } from '@/components/ui/button';


import { Input } from '@/components/ui/input';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import { Label } from '@/components/ui/label';


import { Progress } from '@/components/ui/progress';


import { Badge } from '@/components/ui/badge';


import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


import { useAuth } from '@/contexts/AuthContext';


import { useToast } from '@/components/ui/use-toast';


import { Loader2, MapPin, AlertTriangle, Mail, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';


import { supabase } from '@/integrations/supabase/client';


import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';


import { motion } from 'framer-motion';



type LoginStep = 'location' | 'email' | 'otp';



const LoginForm: React.FC = () => {
  const { loginWithOTP } = useAuth();
  const { toast } = useToast();

  

  const [step, setStep] = useState<LoginStep>('location');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');

  

  const [isLoading, setIsLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  



  
  const [showEmailPreview, setShowEmailPreview] = useState(false);



  

  // Progress tracking (UI enhancement)
  const progressValue = useMemo(() => {
    if (step === 'location') return 33;
    if (step === 'email') return 66;
    return 100;
  }, [step]);





  
  useEffect(() => {
    checkLocationPermission();
  }, []);





  
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);




  
  const checkLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported');
        setLocationGranted(false);
        return;
      }



      

      const permission = await navigator.permissions?.query({ name: 'geolocation' as any });
      if (permission?.state === 'granted') {
        setLocationGranted(true);
        setStep('email');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLocationLoading(false);
    }
  };



  

  const requestLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationGranted(true);
        setStep('email');
        toast({ title: 'Location granted ✅' });
      },
      () => {
        setLocationError('Location required');
        setLocationGranted(false);
      }
    );
  };



  

  const sendOTP = async () => {
    if (!email) return;
    setIsLoading(true);

    try {
      const { data } = await supabase.functions.invoke('send-otp', { body: { email } });
      setOtpSentTo(data?.otpSentTo);
      setStep('otp');
      setResendCooldown(60);
      toast({ title: 'OTP Sent 🚀' });
    } catch (err) {
      toast({ title: 'Error sending OTP', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };



  

  const verifyOTP = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);

    try {
      await loginWithOTP(email, otp);
      toast({ title: 'Welcome back 🔥' });
    } catch (err) {
      toast({ title: 'Invalid OTP', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };



  

  const renderHeader = () => (
    <div className="text-center space-y-2">
      <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent">
        THRYLOS
      </CardTitle>
      <p className="text-muted-foreground text-sm">Secure Admin Access</p>
      <Progress value={progressValue} />
    </div>
  );



  

  const renderLocation = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center space-y-4">
        <MapPin className="w-12 h-12 mx-auto text-orange-400" />
        <p>Location required for security</p>
      </div>


      

      {locationError && (
        <div className="bg-red-500/10 p-3 rounded">
          <AlertTriangle /> {locationError}
        </div>
      )}


      

      <Button className="w-full" onClick={requestLocation}>
        {locationLoading ? <Loader2 className="animate-spin" /> : 'Allow Location'}
      </Button>
    </motion.div>
  );



  

  const renderEmail = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="space-y-4">
        <Label>Email</Label>
        <div className="relative">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          <button
            className="absolute right-2 top-2"
            onClick={() => setShowEmailPreview(!showEmailPreview)}
          >
            {showEmailPreview ? <EyeOff /> : <Eye />}
          </button>
        </div>


        

        {showEmailPreview && (
          <Badge>{email}</Badge>
        )}


        

        <Button onClick={sendOTP} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
        </Button>
      </div>
    </motion.div>
  );


  

  const renderOTP = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center">
        <Shield className="mx-auto text-orange-400" />
        <p>{otpSentTo}</p>
      </div>

      

      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
        <InputOTPGroup>
          {[0,1,2,3,4,5].map(i => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>


      

      <Button onClick={verifyOTP} disabled={otp.length !== 6}>
        Verify
      </Button>

      <div className="text-center text-sm">
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : (
          <button onClick={sendOTP}>Resend</button>
        )}
      </div>
    </motion.div>
  );


  

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>{renderHeader()}</CardHeader>
        <CardContent>
          {step === 'location' && renderLocation()}
          {step === 'email' && renderEmail()}
          {step === 'otp' && renderOTP()}
        </CardContent>
      </Card>
    </div>
  );
};




export default LoginForm;






