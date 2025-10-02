# PDF Upload Troubleshooting Guide

## Issue: PDF Upload Returns HTML Error Instead of JSON

### Problem Description
When uploading PDF files, you may receive an error like:
```
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Root Cause
This error occurs when the server returns an HTML error page instead of a proper JSON response, typically due to:
1. PDF parsing library conflicts
2. Server routing issues
3. File size limitations
4. CORS issues

### Solutions Implemented

#### 1. Improved Error Handling
- Enhanced multer error handling with proper JSON responses
- Better error messages for different failure scenarios
- Consistent error format across all endpoints

#### 2. Basic PDF Support
- Replaced problematic `pdf-parse` library with simple text extraction
- Fallback handling for complex PDF files
- Clear messaging when manual input may be required

#### 3. Enhanced File Validation
- Better file type detection
- Size limit enforcement
- Proper error responses for invalid files

### Testing the Fix

#### Test with Sample Files
1. **TXT files** (recommended): Upload `Sungrow_ST2236UX-US.txt`
2. **DOCX files**: Should work with Word documents
3. **PDF files**: Basic support with fallback messages

#### Expected Behavior
- **Success**: JSON response with `success: true` and extracted specs
- **Failure**: JSON response with `success: false` and error message
- **No HTML**: Should never return HTML error pages

### Best Practices for PDF Upload

#### For Best Results:
1. **Convert PDFs to TXT**: Most reliable extraction
2. **Use structured datasheets**: Clear specifications format
3. **Check file size**: Keep under 10MB
4. **Verify text content**: Ensure PDFs contain searchable text

#### If PDF Upload Fails:
1. Try converting PDF to TXT format
2. Copy/paste specifications into a TXT file
3. Use manual specification entry in the chat
4. Check browser console for detailed error messages

### Manual Specification Entry
If automated extraction fails, you can always:
1. Use the chat to manually specify requirements
2. Enter specifications during conversation
3. The AI will still provide recommendations based on manual input

### Monitoring and Debugging

#### Server Logs
Check the console output for:
- Database connection status
- File processing errors
- API request/response details

#### Browser Console
Monitor for:
- Network errors
- JSON parsing issues
- Upload progress problems

### Future Improvements
- [ ] Advanced PDF parsing with OCR support
- [ ] Excel/CSV datasheet support  
- [ ] Batch upload functionality
- [ ] Enhanced specification validation
- [ ] Manual specification editor interface

### Support
If issues persist:
1. Check all sample TXT files work first
2. Verify server is running on port 5000
3. Confirm frontend is on port 5174
4. Review browser network tab for actual server responses