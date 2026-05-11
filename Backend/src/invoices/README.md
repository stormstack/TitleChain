# Invoice Upload System

This module provides comprehensive invoice management with file upload capabilities for the TitleChain platform.

## Features

- **File Upload**: Upload invoice documents with metadata validation
- **File Management**: Download and delete invoice files
- **Status Tracking**: Automatic status management (PENDING_VERIFICATION → VERIFIED/REJECTED)
- **File Validation**: Support for PDF, DOC, DOCX, JPEG, PNG files up to 10MB
- **Secure Storage**: Files stored with unique names and proper directory structure

## API Endpoints

### Upload Invoice with Document

**POST** `/invoices/upload`

Uploads an invoice document along with metadata.

**Request**: `multipart/form-data`
- `file`: Invoice document (required)
- `invoiceNumber`: Invoice number (required)
- `counterpartyId`: Counterparty ID (required)
- `counterpartyName`: Counterparty name (required)
- `dueDate`: Due date (ISO string, required)
- `amount`: Invoice amount (optional)
- `counterpartyReputation`: Counterparty reputation 1-100 (optional)
- `businessHistoryMonths`: Business history in months (optional)
- `uploadedBy`: Business user ID (optional)

**Response**:
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-001",
  "amount": 10000.00,
  "counterpartyId": "counterparty-123",
  "counterpartyName": "ABC Corp",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "status": "pending_verification",
  "documentFileName": "invoice.pdf",
  "documentFilePath": "/uploads/invoices/filename.pdf",
  "documentMimeType": "application/pdf",
  "documentSize": 1024000,
  "uploadedBy": "user-123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Download Invoice Document

**GET** `/invoices/:id/download`

Downloads the invoice document associated with the invoice.

**Response**: File download with appropriate headers

### Delete Invoice Document

**DELETE** `/invoices/:id/file`

Deletes the invoice document from storage and updates the invoice record.

**Response**:
```json
{
  "message": "Invoice file deleted successfully"
}
```

## File Upload Validation

### Supported File Types
- PDF: `application/pdf`
- Word Document: `application/msword`
- Word Document (XML): `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- JPEG: `image/jpeg`
- PNG: `image/png`

### File Size Limits
- Maximum file size: 10MB
- Files larger than 10MB will be rejected

### File Storage
- Files are stored in `./uploads/invoices/` directory
- Each file gets a unique filename to prevent conflicts
- Original filename is preserved in the database for download

## Database Schema

### Invoice Entity Updates

The Invoice entity has been updated with the following fields for file support:

```typescript
@Column({ nullable: true })
documentFileName: string;

@Column({ nullable: true })
documentFilePath: string;

@Column({ nullable: true })
documentMimeType: string;

@Column({ nullable: true })
documentSize: number;

@Column({ nullable: true })
uploadedBy: string;
```

### Status Enum

```typescript
export enum InvoiceStatus {
  PENDING = "pending",
  PENDING_VERIFICATION = "pending_verification",
  VERIFIED = "verified",
  REJECTED = "rejected",
}
```

## Usage Examples

### Upload Invoice with curl

```bash
curl -X POST \
  http://localhost:3000/invoices/upload \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/invoice.pdf' \
  -F 'invoiceNumber=INV-001' \
  -F 'counterpartyId=customer-123' \
  -F 'counterpartyName=ABC Corp' \
  -F 'dueDate=2024-12-31' \
  -F 'amount=10000' \
  -F 'uploadedBy=user-123'
```

### Upload Invoice with JavaScript

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('invoiceNumber', 'INV-001');
formData.append('counterpartyId', 'customer-123');
formData.append('counterpartyName', 'ABC Corp');
formData.append('dueDate', '2024-12-31');
formData.append('amount', '10000');
formData.append('uploadedBy', 'user-123');

fetch('/invoices/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Error Handling

### Common Error Responses

**400 Bad Request**:
- File is required
- Invalid file type
- File size too large
- Invalid metadata

**404 Not Found**:
- Invoice not found
- Document file not found

**500 Internal Server Error**:
- File system errors
- Database errors

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "File is required",
  "error": "Bad Request"
}
```

## Security Considerations

### File Upload Security
- File type validation based on MIME type
- File size limits enforced
- Unique filename generation prevents path traversal
- Files stored outside web root when possible

### Authentication
- All endpoints should be protected with authentication
- `uploadedBy` field should be automatically set from authenticated user
- Users should only be able to access their own invoices

## Configuration

### Environment Variables

```bash
# File upload directory (optional, defaults to ./uploads/invoices)
UPLOAD_DIR=./uploads/invoices

# Maximum file size in bytes (optional, defaults to 10MB)
MAX_FILE_SIZE=10485760
```

### Multer Configuration

The module uses Multer with the following configuration:
- Storage: Disk storage with custom filename generation
- File size limit: 10MB
- File filter: Validates MIME types
- Destination: `./uploads/invoices/`

## Development Notes

### Directory Structure

```
src/invoices/
├── dto/
│   ├── create-invoice.dto.ts
│   ├── update-invoice.dto.ts
│   └── upload-invoice.dto.ts
├── invoice.entity.ts
├── invoices.controller.ts
├── invoices.module.ts
├── invoices.service.ts
└── README.md
```

### Testing

To test file upload functionality:

1. Ensure the upload directory exists and is writable
2. Use a tool like Postman or curl to test file uploads
3. Verify files are stored correctly in the upload directory
4. Test file download and deletion functionality

### File Cleanup

Consider implementing:
- Scheduled cleanup of orphaned files
- File compression for large documents
- Backup strategies for uploaded files

## Integration Points

### Risk Assessment Module
- Uploaded invoices are automatically set to `PENDING_VERIFICATION` status
- Risk assessment can only be performed on verified invoices
- File documents are used for manual verification process

### Tokenization Module
- Only verified invoices can be tokenized
- Invoice documents may be required for tokenization validation

### Repayment Module
- Invoice documents may be referenced during repayment processing
- Audit trail includes document references

## Monitoring and Logging

### Upload Events
- Successful uploads are logged with file details
- Failed uploads are logged with error details
- File system operations are monitored

### Metrics to Track
- Upload success/failure rates
- File size distribution
- File type distribution
- Storage usage over time
