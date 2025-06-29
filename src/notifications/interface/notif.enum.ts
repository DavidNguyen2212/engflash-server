export enum NotificationType {
    VOCAB_SET_UPDATE = 'VOCAB_SET_UPDATE',  // for favorite users
    NEW_DEFAULT_SET   = 'NEW_DEFAULT_SET', // common 
    SRS_REVIEW        = 'SRS_REVIEW', // specially, for user
    SYSTEM            = 'SYSTEM', // from system, like new function after updates, new policy...
  }
  
export enum Channel {
IN_APP = 'IN_APP',
PUSH   = 'PUSH',
}