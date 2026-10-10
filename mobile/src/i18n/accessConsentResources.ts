export const accessSecurityEn={
  title:'Staff security',signIn:'Sign in',signInDescription:'Use your confirmed email and password. Staff must also verify an authenticator code. Owner phone verification is a separate step.',
  description:'Agents and reviewers need a password and an authenticator-app code. Sign in again after one hour. Access also depends on your current authority grants.',
  setup:'Set up authenticator',secret:'Authenticator setup key',secretHelp:'Enter this key in your authenticator app, then enter its six-digit code below. Keep the key private.',
  code:'Six-digit authenticator code',verify:'Verify staff access',ready:'The server verified your current staff access.',
  failed:'Verification failed. Check the code and your account access. If you signed in over an hour ago, sign out and sign in again.',
  recovery:'If you lose your authenticator, contact your administrator. Recovery requires identity checks and session revocation; this app cannot bypass MFA.',
};
export const accessSecurityFr={
  title:'Sécurité du personnel',signIn:'Se connecter',signInDescription:'Utilisez votre adresse e-mail confirmée et votre mot de passe. Le personnel doit aussi vérifier un code d’authentification. La vérification du téléphone du propriétaire est une étape distincte.',
  description:'Les agents et réviseurs doivent utiliser un mot de passe et un code d’une application d’authentification. Reconnectez-vous après une heure. L’accès dépend aussi de vos habilitations actuelles.',
  setup:'Configurer l’authentificateur',secret:'Clé de configuration',secretHelp:'Saisissez cette clé dans votre application d’authentification, puis son code à six chiffres ci-dessous. Gardez cette clé confidentielle.',
  code:'Code d’authentification à six chiffres',verify:'Vérifier l’accès du personnel',ready:'Le serveur a vérifié votre accès actuel.',
  failed:'La vérification a échoué. Vérifiez le code et vos habilitations. Si votre connexion date de plus d’une heure, déconnectez-vous puis reconnectez-vous.',
  recovery:'Si vous perdez votre authentificateur, contactez votre administrateur. La récupération exige une vérification d’identité et la révocation des sessions ; cette application ne peut pas contourner l’authentification multifacteur.',
};
export const ownerConsentEn={
  title:'Registration consent',description:'Review your vehicle and the approved agreement in your own account. Your choice does not verify your phone or approve registration.',
  load:'Load my applications',empty:'No registration applications are assigned to this account.',vehicle:'Vehicle details',status:'Consent status',version:'Agreement version',
  retention:'Record retention',contact:'Privacy and withdrawal contact',notConfigured:'Approved consent has not been published. Acceptance is unavailable.',
  ack:'I reviewed these vehicle details and read this agreement.',accept:'Accept this registration agreement',withdraw:'Withdraw consent before activation',
  active:'Registration is active. Contact the privacy contact about withdrawal or your records.',history:'Consent history',retry:'Retry the same choice',refresh:'Reload current application',back:'All my applications',
  failed:'The request could not be completed. If the application changed, reload it and review the current agreement. An uncertain result can be retried using the same choice.',
  states:{MISSING:'Not accepted',STALE:'Changed — review again',ACCEPTED:'Accepted',WITHDRAWN:'Withdrawn'},events:{ACCEPT:'Accepted',WITHDRAW:'Withdrawn'},
};
export const ownerConsentFr={
  title:'Consentement à l’enregistrement',description:'Examinez votre véhicule et l’accord approuvé dans votre propre compte. Votre choix ne vérifie pas votre téléphone et n’approuve pas l’enregistrement.',
  load:'Charger mes demandes',empty:'Aucune demande d’enregistrement n’est attribuée à ce compte.',vehicle:'Détails du véhicule',status:'État du consentement',version:'Version de l’accord',
  retention:'Conservation des données',contact:'Contact pour la confidentialité et le retrait',notConfigured:'Le consentement approuvé n’a pas été publié. L’acceptation est indisponible.',
  ack:'J’ai vérifié ces détails du véhicule et lu cet accord.',accept:'Accepter cet accord d’enregistrement',withdraw:'Retirer le consentement avant l’activation',
  active:'L’enregistrement est actif. Contactez le responsable de la confidentialité pour le retrait ou vos données.',history:'Historique du consentement',retry:'Réessayer le même choix',refresh:'Recharger la demande actuelle',back:'Toutes mes demandes',
  failed:'La demande n’a pas pu aboutir. Si elle a changé, rechargez-la et examinez l’accord actuel. Un résultat incertain peut être réessayé avec le même choix.',
  states:{MISSING:'Non accepté',STALE:'Modifié — à revoir',ACCEPTED:'Accepté',WITHDRAWN:'Retiré'},events:{ACCEPT:'Accepté',WITHDRAW:'Retiré'},
};
