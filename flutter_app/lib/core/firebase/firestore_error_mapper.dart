import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreErrorMapper {
  const FirestoreErrorMapper._();

  static String toUserMessage(Object error) {
    if (error is FirebaseException) {
      switch (error.code) {
        case 'permission-denied':
          return 'Your portal role does not have permission to perform this action.';
        case 'unavailable':
          return 'Network unavailable. Changes are cached locally and will sync automatically.';
        case 'not-found':
          return 'The requested record no longer exists in Cloud Firestore.';
        case 'failed-precondition':
          return 'Required Firestore composite index is missing. Run firebase deploy --only firestore:indexes.';
        default:
          return error.message ?? 'Firestore operation failed (${error.code}).';
      }
    }
    return error.toString();
  }
}
