import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, FileText, Shield, Briefcase, Users, Rocket, Heart, ChevronDown, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Careers: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    fullAddress: '',
    city: '',
    state: '',
    country: 'India',
    dateOfBirth: '',
    roleAppliedFor: '',
    yearsOfExperience: '',
    skills: '',
    whyJoinThrylos: '',
    additionalNotes: '',
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);

  // Pre-compute stable random values for particles to avoid re-computing on every render
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      colorClass:
        i % 3 === 0 ? 'w-2 h-2 bg-blue-400/40' :
        i % 3 === 1 ? 'w-1 h-1 bg-purple-400/40' :
        'w-1.5 h-1.5 bg-cyan-400/30',
    })),
  []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('career-documents')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data } = supabase.storage
      .from('career-documents')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.mobileNumber || !formData.email || !formData.roleAppliedFor) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files
      let resumeUrl = null;
      let aadharUrl = null;
      const additionalDocUrls: string[] = [];

      if (resumeFile) {
        resumeUrl = await uploadFile(resumeFile, 'resumes');
      }
      if (aadharFile) {
        aadharUrl = await uploadFile(aadharFile, 'aadhar');
      }
      for (const file of additionalFiles) {
        const url = await uploadFile(file, 'additional');
        if (url) additionalDocUrls.push(url);
      }

      const { error } = await supabase
        .from('career_applications')
        .insert({
          full_name: formData.fullName,
          mobile_number: formData.mobileNumber,
          email: formData.email,
          full_address: formData.fullAddress,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          date_of_birth: formData.dateOfBirth || null,
          role_applied_for: formData.roleAppliedFor,
          years_of_experience: formData.yearsOfExperience,
          skills: formData.skills,
          why_join_thrylos: formData.whyJoinThrylos,
          additional_notes: formData.additionalNotes,
          resume_url: resumeUrl,
          aadhar_url: aadharUrl,
          additional_documents: additionalDocUrls,
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Thank you for applying to THRYLOS. We'll review your application and get back to you soon.",
      });

      // Reset form
      setFormData({
        fullName: '',
        mobileNumber: '',
        email: '',
        fullAddress: '',
        city: '',
        state: '',
        country: 'India',
        dateOfBirth: '',
        roleAppliedFor: '',
        yearsOfExperience: '',
        skills: '',
        whyJoinThrylos: '',
        additionalNotes: '',
      });
      setResumeFile(null);
      setAadharFile(null);
      setAdditionalFiles([]);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    'Developer',
    'Designer',
    'Marketing',
    'Community Manager',
    'Operations',
    'Content Creator',
    'Other'
  ];

  // Stack cards data - 6 cards for 3x2 grid
  const stackCards = [
    { icon: <Rocket className="w-6 h-6" />, title: "Innovation First", description: "Pushing the boundaries of esports technology." },
    { icon: <Users className="w-6 h-6" />, title: "Team Spirit", description: "A passionate team that lives competitive gaming." },
    { icon: <Briefcase className="w-6 h-6" />, title: "Growth Opportunities", description: "Real mentorship and esports projects." },
    { icon: <Shield className="w-6 h-6" />, title: "Secure Future", description: "India's fastest-growing esports ecosystem." },
    { icon: <Heart className="w-6 h-6" />, title: "Work-Life Balance", description: "Sustainable growth and flexibility." },
    { icon: <FileText className="w-6 h-6" />, title: "Learning Culture", description: "Continuous skill development at our core." }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-full h-full background-image-blink"
            style={{
              backgroundImage: `url(/thrylosindia.png)`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.1,
              transform: `translateY(${scrollY * 0.2}px)`,
            }}
          ></div>
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-[spin_20s_linear_infinite]"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/15 to-indigo-600/15 rounded-full blur-3xl animate-[spin_25s_linear_infinite_reverse]"></div>
        
        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-full ${p.colorClass}`}
            style={{
              left: p.left,
              top: p.top,
              animation: `floating-particles ${p.duration} linear infinite`,
              animationDelay: p.delay,
            }}
          ></div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div 
          className="text-center z-10"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <Link to="/">
            <h1 
              className="text-6xl md:text-8xl font-extrabold tracking-wide text-transparent bg-clip-text mb-6 animate-scale-in cursor-pointer hover:scale-105 transition-transform"
              style={{ 
                fontFamily: "'Nixmat', sans-serif",
                backgroundImage: 'linear-gradient(90deg, #f97316 0%, #ec4899 50%, #3b82f6 100%)',
              }}
            >
              THRYLOS
            </h1>
          </Link>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
            Careers
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Build the future of competitive esports with us
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Join India's fastest-growing esports organization and be part of a team that's revolutionizing competitive gaming. 
            We're looking for passionate individuals who want to shape the future of esports.
          </p>
          <Button 
            onClick={scrollToForm}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold animate-fade-in hover:scale-105 transition-all"
            style={{ animationDelay: '0.6s' }}
          >
            Apply Now
            <ChevronDown className="ml-2 w-5 h-5 animate-bounce" />
          </Button>
        </div>
      </section>

      {/* 3x2 Grid Cards Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            Why Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500">THRYLOS</span>?
          </h3>
          
          {/* 3x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stackCards.map((card, index) => (
              <div
                key={index}
                className="group relative bg-zinc-900/80 border border-white/10 rounded-lg p-6 transition-all duration-500 hover:border-purple-500/50 hover:bg-zinc-900"
                style={{
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:via-purple-500/5 group-hover:to-blue-500/10 transition-all duration-500 pointer-events-none" />
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 pointer-events-none" />
                
                <div className="relative flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/80 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all duration-300">
                    {card.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">{card.title}</h4>
                    <p className="text-white/50 text-sm leading-relaxed">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section ref={formRef} className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3 flex-wrap">
              <span>Apply to</span>
              <span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 inline-block" 
                style={{ fontFamily: "'Nixmat', sans-serif", verticalAlign: 'baseline' }}
              >
                THRYLOS
              </span>
            </h3>
            <p className="text-muted-foreground">Fill out the form below to start your journey with us</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Details Card */}
            <div className="bg-black/70 border border-white/20 backdrop-blur-sm rounded-2xl p-6 md:p-8">
              <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Personal Details
              </h4>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-200">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber" className="text-gray-200">Mobile Number <span className="text-destructive">*</span></Label>
                    <Input
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      placeholder="+91 XXXXXXXXXX"
                      className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200">Email Address <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-gray-200">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullAddress" className="text-gray-200">Full Address</Label>
                  <Textarea
                    id="fullAddress"
                    value={formData.fullAddress}
                    onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                    placeholder="Enter your complete address"
                    className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-200">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Your city"
                      className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-200">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Your state"
                      className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-gray-200">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Your country"
                      className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details Card */}
            <div className="bg-black/70 border border-white/20 backdrop-blur-sm rounded-2xl p-6 md:p-8">
              <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                Professional Details
              </h4>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="roleAppliedFor" className="text-gray-200">Role Applying For <span className="text-destructive">*</span></Label>
                    <Select value={formData.roleAppliedFor} onValueChange={(value) => handleInputChange('roleAppliedFor', value)}>
                      <SelectTrigger className="bg-black/60 border-white/30 text-white h-12">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/30">
                        {roles.map((role) => (
                          <SelectItem key={role} value={role} className="text-white hover:bg-white/10">
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience" className="text-gray-200">Years of Experience</Label>
                    <Select value={formData.yearsOfExperience} onValueChange={(value) => handleInputChange('yearsOfExperience', value)}>
                      <SelectTrigger className="bg-black/60 border-white/30 text-white h-12">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/30">
                        <SelectItem value="fresher" className="text-white hover:bg-white/10">Fresher</SelectItem>
                        <SelectItem value="0-1" className="text-white hover:bg-white/10">0-1 Years</SelectItem>
                        <SelectItem value="1-3" className="text-white hover:bg-white/10">1-3 Years</SelectItem>
                        <SelectItem value="3-5" className="text-white hover:bg-white/10">3-5 Years</SelectItem>
                        <SelectItem value="5+" className="text-white hover:bg-white/10">5+ Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-gray-200">Skills</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    placeholder="List your relevant skills (e.g., React, Video Editing, Social Media Marketing...)"
                    className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whyJoinThrylos" className="text-gray-200">Why do you want to join THRYLOS?</Label>
                  <Textarea
                    id="whyJoinThrylos"
                    value={formData.whyJoinThrylos}
                    onChange={(e) => handleInputChange('whyJoinThrylos', e.target.value)}
                    placeholder="Tell us why you're excited about joining THRYLOS..."
                    className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes" className="text-gray-200">Additional Message / Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    placeholder="Anything else you'd like us to know..."
                    className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload Card */}
            <div className="bg-black/70 border border-white/20 backdrop-blur-sm rounded-2xl p-6 md:p-8">
              <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-400" />
                Document Upload
              </h4>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Resume / CV (PDF preferred)</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                      >
                        {resumeFile ? (
                          <>
                            <FileText className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 truncate max-w-[200px]">{resumeFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-muted-foreground">Upload Resume</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX - Max 10MB</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-200">Aadhar Card</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="aadhar-upload"
                      />
                      <label
                        htmlFor="aadhar-upload"
                        className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                      >
                        {aadharFile ? (
                          <>
                            <FileText className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 truncate max-w-[200px]">{aadharFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-muted-foreground">Upload Aadhar</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG - Max 5MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Additional Supporting Documents (Optional)</Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      multiple
                      onChange={(e) => setAdditionalFiles(Array.from(e.target.files || []))}
                      className="hidden"
                      id="additional-upload"
                    />
                    <label
                      htmlFor="additional-upload"
                      className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                    >
                      {additionalFiles.length > 0 ? (
                        <>
                          <FileText className="w-5 h-5 text-green-400" />
                          <span className="text-green-400">{additionalFiles.length} file(s) selected</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-muted-foreground">Upload Additional Documents</span>
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">Certificates, portfolios, etc. - Multiple files allowed</p>
                </div>
              </div>
            </div>

            {/* Submit Button & Trust Section */}
            <div className="bg-black/70 border border-white/20 backdrop-blur-sm rounded-2xl p-6 md:p-8">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-14 text-lg font-semibold hover:scale-[1.02] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  'Apply to THRYLOS'
                )}
              </Button>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  All information shared is kept secure and used only for recruitment purposes.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Sensitive documents are requested only for verification if shortlisted.
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-8">
            {/* Brand */}
            <Link to="/">
              <h3 
                className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text inline-block cursor-pointer hover:scale-105 transition-transform"
                style={{ 
                  fontFamily: "'Nixmat', sans-serif",
                  backgroundImage: 'linear-gradient(90deg, #f97316 0%, #ec4899 50%, #3b82f6 100%)',
                }}
              >
                THRYLOS
              </h3>
            </Link>
            
            <p className="text-xl text-white/80 font-medium">
              Building India's Competitive Esports Future
            </p>
            
            {/* Contact */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/60">
              <a 
                href="mailto:careers@thrylos.in" 
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                careers@thrylos.in
              </a>
              <span className="hidden sm:block">•</span>
              <a 
                href="mailto:contact@thrylos.in" 
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact@thrylos.in
              </a>
            </div>
            
            {/* Divider */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto"></div>
            
            {/* Credits */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-white/40">
                <span>A</span>
                <span
                  className="font-bold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
                  style={{ fontFamily: "'Merlin', cursive" }}
                >
                  misterutsav
                </span>
                <span>PRODUCT</span>
                <Heart className="h-3 w-3 text-destructive fill-destructive animate-pulse" />
              </div>
              <p className="text-xs text-white/30">
                © {new Date().getFullYear()} THRYLOS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Careers;
