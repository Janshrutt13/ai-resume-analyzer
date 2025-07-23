import React, { useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "../../lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "../../lib/pdf2image";
import {generateUUID} from "../../lib/util";
import {prepareInstructions} from "../../constants";

const upload = () => {
   const {auth , isLoading, fs, kv, ai} = usePuterStore();
   const navigate = useNavigate();
   const [isProcessing, setIsProcessing] = React.useState(false);
   const[statusText, setStatusText] = React.useState("");
   const [file, setFile] = useState<File | null>(null);

   const handleFileSelect  = (file : File | null) => {
     setFile(file)
   }
   const handleAnalyze = async ({companyName, jobTitle, jobDescription, file}: {
       companyName : string, jobTitle : string, jobDescription : string, file : File }) => {
       setIsProcessing(true);
       setStatusText("Uploading your file...");
       const uploadedFile = await fs.upload([file]);
       if(!uploadedFile) return setStatusText('Error failed to upload file');

       setStatusText('Converting to image');
       const imageFile = await convertPdfToImage(file);
       if(!imageFile.file) return setStatusText('Error converting PDF to image');

       setStatusText('Converting to PDF');
       const uploadedImage = await fs.upload([imageFile.file]);
       if(!uploadedImage) return setStatusText('Error failed to upload image');

       setStatusText('generating data...');
       const uuid = generateUUID();
       const data = {
           id: uuid,
           companyName,jobDescription,jobTitle,
           imagePath : uploadedImage.path,
           resumePath : uploadedFile.path,
           feedback : '',
       }
       await kv.set(`resume:${uuid}`, JSON.stringify(data));
       setStatusText('Analyzing data');
       const feedback = await ai.feedback(
           uploadedFile.path,
           prepareInstructions({jobTitle, jobDescription}),
       )
       if(!feedback) return setStatusText('Error: Failed to analyze!');

       const feedbackText = typeof feedback.message.content === 'string'
       ? feedback.message.content
       : feedback.message.content[0].text

       data.feedback = JSON.parse(feedbackText);
       await kv.set(`resume:${uuid}`, JSON.stringify(data));
       setStatusText('Analyzing complete, redirecting...');
       console.log(data);
   }

   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const form = e.currentTarget.closest('form');
     if(!form) return;
     const formData = new FormData(form);

     const companyName = formData.get("company-name" ) as string;
     const jobTitle = formData.get("job-title") as string;
     const jobDescription = formData.get("job-description") as string;

     if(!file) return;
     handleAnalyze({companyName,jobTitle,jobDescription,file});
   }
    return (
      <main className="bg-[url('/assets/images/bg-main.svg')] bg-cover min-h-screen">
        <Navbar />
        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Smart Feedback for your dream.</h1>
            {isProcessing ? (
              <>
                 <h2>{statusText}</h2>
                 <img src = "/assets/images/resume-scan.gif" className="w-full" />
              </>
              ) : (
                <h2>Drop your resume for ATS score and improvement tips</h2>
            )}
            {!isProcessing && (
               <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                  <div className="form-div">
                      <label htmlFor="company-name">Company Name</label>
                      <input id="company-name" type="text" name="form-control" placeholder="Company Name" />
                  </div>
                 <div className="form-div">
                   <label htmlFor="job-title">Job Title</label>
                   <input id="job-title" type="text" name="form-control" placeholder="Job Title" />
                 </div>
                 <div className="form-div">
                   <label htmlFor="job-description">Job Description</label>
                   <textarea rows={5} name="form-control" placeholder="Job Description" id="job-description" />
                 </div>
                 <div className="form-div">
                   <label htmlFor="uploader">Upload Resume</label>
                   <FileUploader onFileSelect = {handleFileSelect} />
                   <button className="primary-button" type="submit">Analyze Resume</button>
                 </div>
               </form>
            )}
          </div>
        </section>
      </main>
    );
};

export default upload;
