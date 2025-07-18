# Image Cleanup Implementation

## Overview

This implementation ensures that unused images are automatically deleted from Supabase storage when they are removed from the application, preventing storage bloat and unnecessary costs.

## How It Works

### 1. Upload Process
- When a user uploads an image, it's stored in the `course-images` bucket in Supabase Storage
- Images are named with a timestamp pattern: `course_1234567890.jpg`
- If replacing an existing image, the old image is automatically deleted first

### 2. Deletion Process
- When users click the "X" button to remove an image, it triggers both:
  - Removal from the form/database field
  - Deletion from Supabase Storage

### 3. Image Replacement
- When uploading a new image to replace an existing one:
  - The old image is deleted from storage first
  - Then the new image is uploaded
  - This prevents orphaned files in storage

## Components Modified

### API Routes
- **`/api/upload/image`**: Added DELETE method to handle image deletion
  - Extracts filename from URL
  - Validates filename format (must start with `course_`)
  - Deletes from Supabase Storage using the `remove()` method

### UI Components
- **`ImageUpload`**: Updated to call deletion API when removing images
  - Handles both explicit removal (X button) and replacement
  - Shows user feedback with toast notifications
  - Gracefully handles deletion failures

### Utility Functions
- **`utils/image-cleanup.ts`**: Created reusable utility functions
  - `deleteImageFromStorage()`: Main deletion function
  - `extractFilenameFromUrl()`: Safely extracts filename from URLs
  - `isValidCourseImageUrl()`: Validates image URL format

## Usage Examples

### Removing an Image
```typescript
import { deleteImageFromStorage } from '@/utils/image-cleanup';

const success = await deleteImageFromStorage(imageUrl);
if (success) {
  // Image deleted successfully
} else {
  // Handle deletion failure
}
```

### In React Components
The `ImageUpload` component automatically handles cleanup:
```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  placeholder="Upload course image"
/>
```

## Error Handling

- **Graceful Degradation**: If deletion fails, the image is still removed from the form
- **User Feedback**: Toast notifications inform users of success/failure
- **Logging**: Errors are logged to console for debugging
- **Validation**: URLs are validated before attempting deletion

## Security Considerations

- Only images with `course_` prefix can be deleted
- URL validation prevents deletion of arbitrary files
- Server-side validation ensures proper authorization

## Benefits

1. **Storage Efficiency**: Prevents accumulation of unused images
2. **Cost Control**: Reduces Supabase storage usage and costs
3. **Clean Administration**: Keeps storage organized and manageable
4. **User Experience**: Seamless image management without manual cleanup
5. **Consistency**: Works across all components that use `ImageUpload`

## Used In

- Course Builder: Question images and option images
- Challenge Manager: All challenge type images
- Course Manager: Course logos and images

## Future Enhancements

- **Batch Cleanup**: Periodic cleanup of orphaned images
- **Usage Tracking**: Track which images are actually being used
- **Backup Strategy**: Optional image archiving before deletion
- **Admin Dashboard**: Interface to manage storage and cleanup 