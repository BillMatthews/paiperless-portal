# Testing Plan for Voy Portal

## Test Users
| User   | Authentication | Roles                                                                                                                                                                   | Description           |
|--------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------|
| user01 | web2 + MFA     | PortalAdmin-Manager                                                                                                                                                     | Portal Admin          |
| user02 | web2           | Onboarding-Agent <br/> DealDesk-Agent                                                                                                                                   | Agent                 |
| user03 | web3           | Onboarding-Supervisor                                                                                                                                                   | Onboarding Supervisor |
| user04 | web2           | Onboarding-Manager                                                                                                                                                      | Onboarding Manager    |
| user05 | web3           | DealDesk-Supervisor                                                                                                                                                     | DealDesk Supervisor   |
| user06 | web2           | DealDesk-Manager                                                                                                                                                        | DealDesk Manager      |
| user07 | web2           | Onboarding-Agent <br/> Onboarding-Supervisor                                                                                                                            | Onboarding            |
| user08 | web2           | Onboarding-Agent <br/> Onboarding-Supervisor <br/> Onboarding-Manager                                                                                                   | Onboarding            |
| user07 | web2           | DealDesk-Agent <br/> DealDesk-Supervisor                                                                                                                                | DealDesk              |
| user08 | web2           | DealDesk-Agent <br/> DealDesk-Supervisor <br/> DealDesk-Manager                                                                                                         | DealDesk              |
| user09 | web2           | PortalAdmin-Manager  <br/> Onboarding-Agent <br/> Onboarding-Supervisor <br/> Onboarding-Manager <br/>  DealDesk-Agent <br/> DealDesk-Supervisor <br/> DealDesk-Manager | All Roles             | 


## Test scenarios
The following is a set of scenarios to be checked for each new release

### Authentication
These tests ensure that access to the application is restricted to valid user accounts providing valid credentials

| Scenario      | Description                                                                                         | Expected Result                                                                                                                                                                                                           |
|---------------|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| SEC.01.01     | Log in using a Web2 only user.                                                                      | Ensure the user can access using email and password and is presented with the main screen                                                                                                                                 |
| SEC.01.02     | Log in using a Web2 + MFA user.                                                                     | Ensure the user can access using email and password and is presented with the MFA challenge. Ensure that the user can provide a valid MFA code to complete the process. Ensure the user is presented with the main screen |
| SEC.01..01.03 | Log in using a Web3 user.                                                                           | Ensure the user can by connecting their wallet and is presented with the SIWE challenge. Ensure that the user can sign the auth request code to complete the process. Ensure the user is presented with the main screen   |
| SEC.01.04     | Attempt log in using a Web2 but provide an incorrect email address                                  | Ensure that a suitable error is displayed and the user is unable to access to the main screen                                                                                                                             |
| SEC.01.05     | Attempt log in using a Web2 but provide a valid email address but invalid password                  | Ensure that a suitable error is displayed and the user is unable to access to the main screen                                                                                                                             |
| SEC.01.06     | Attempt log in using a Web2 + MFA and provide a valid valid email/password but an invalid MFA Code. | Ensure that a suitable error is displayed and the user is unable to access to the main screen                                                                                                                             |
| SEC.01.07     | Attempt a web2 login but do not provide a userid/password.                                          | Ensure that an appropriate error is displayed.<br/> Ensure that the main screen is not displayed                                                                                                                          |
| SEC.01.08     | Attempt to login using a web2 account that does not have access to the Voy Portal.                  | Ensure that a suitable error message is displayed. <br/> Ensure that the main screen is not displayed                                                                                                                     |
| SEC.01.09     | Attempt to login using a web3 account that does not have access to the Voy Portal.                  | Ensure that a suitable error message is displayed. <br/> Ensure that the main screen is not displayed                                                                                                                     |
| SEC.01.10     | Attempt to login using a web2 account that has been deactivated (soft deleted)                      | Ensure that a suitable error message is displayed. <br/> Ensure that the main screen is not displayed                                                                                                                     |
| SEC.01.11     | Attempt to login using a web3 account that has been deactivated (soft deleted)                      | Ensure that a suitable error message is displayed. <br/> Ensure that the main screen is not displayed                                                                                                                     |
| SEC.01.12     | Attempt to login using a user account linked to a deactivated Company Account                       | Ensure that a suitable error message is displayed. <br/> Ensure that the main screen is not displayed                                                                                                                     |
| SEC.01.13     | Attempt to directly access the main Portal page when not logged in                                  | Ensure that a suitable error message is displayed. <br/> Ensure that the main screen is not displayed                                                                                                                     |
| SEC.01.14     | Attempt to directly access the Deal Desk page when not logged in                                    | Ensure that a suitable error message is displayed. <br/> Ensure that the requested screen is not displayed                                                                                                                |
| SEC.01.15     | Attempt to directly access a deal within the Deal Desk when not logged in                           | Ensure that a suitable error message is displayed. <br/> Ensure that the requested screen is not displayed                                                                                                                |
| SEC.01.16     | Attempt to directly access the Onboarding Desk page when not logged in                              | Ensure that a suitable error message is displayed. <br/> Ensure that the requested screen is not displayed                                                                                                                |
| SEC.01.17     | Attempt to directly access an Onboarding page within the Onboarding Desk when not logged in         | Ensure that a suitable error message is displayed. <br/> Ensure that the requested screen is not displayed                                                                                                                |
| SEC.01.16     | Attempt to directly access the main Customer Account page when not logged in                        | Ensure that a suitable error message is displayed. <br/> Ensure that the requested screen is not displayed                                                                                                                |
| SEC.01.17     | Attempt to directly access a customer within the Customer Accounts page when not logged in          | Ensure that a suitable error message is displayed. <br/> Ensure that the requested screen is not displayed                                                                                                                |

### Authorisation
These tests ensure that an authenticated user can only perform the actions applicable to their allocated roles

| Scenario  | Description                  | Expected Result                                                                                                                                                                       |
|-----------|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| SEC.02.01 | Login using test user USER01 | Ensure that the user can access the User Management screen <br/>Ensure the user can access the Customer Management screen.<br/>Ensure the user does not have access to other features |
| SEC.02.02 | Login using test user USER02 | Ensure that the user can access the Onboarding screen <br/>Ensure the user can access the Deal Desk screen.<br/>Ensure the user does not have access to other features                |


### Authorisation Features
#### Forgot Password Feature
| Scenario  | Description                                                                                                                          | Expected Result                                                                                                                                          |
|-----------|--------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| SEC.03.01 | Ensure that a Web2 user can complete the Forgot Password process to reset their password                                             | A Reset Password email is sent to the user. The user can reset their password using the provided reset link.<br/>The user can login using the new password |
| SEC.03.02 | Ensure that a Web2+MFA user can complete the Forgot Password process to reset their password                                         | A Reset Password email is sent to the user. The user can reset their password using the provided reset link.<br/>The user can login using the new password |

#### Sign Out Feature
| Scenario  | Description                                             | Expected Result                                                                                                                                          |
|-----------|---------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| SEC.04.01 | Ensure that a Web2 user can sign out of the application | The user is returned to the login page. The user cannot directly access pages within the application                                                     |
| SEC.04.02 | Ensure that a Web3 user can sign out of the application | The user is returned to the login page. The user cannot directly access pages within the application                                                     |


#### Change Password Feature
| Scenario  | Description                                                                                                                          | Expected Result                                                                                                              |
|-----------|--------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| SEC.05.01 | Ensure that a Web2 user can change their password by providing their current and a new password                                      | The user is prompted to provide their current and new passwords.<br/>Once changed, the user can login using the new password |
| SEC.05.02 | Ensure that a Web2 user cannot change their password if they provide an incorrect current password and a new password                | A suitable error is displayed.<br/>The user's password is not changed and their current password can still be used to login  |
| SEC.05.03 | Ensure that a Web2 user cannot change their password if they provide a new password that does not meet the password complexity rules | A suitable error is displayed.<br/>The user's password is not changed and their current password can still be used to login  |
| SEC.05.04 | Ensure that a Web3 user is not provided with the option to change their password                                                     | The change password option is not provided to the user                                                                       |

__To Be Determined:__
1. Can a Web2 + MFA user login using backup codes? If so how do they reset their Authenticator App settings?

#### Client Access Feature
| Scenario  | Description                                                                                        | Expected Result                                                |
|-----------|----------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| SEC.06.01 | Ensure that the Portal cannot retrieve data from the API if no CLIENT API KEY is provided          | A suitable error message is returned and displayed to the user |
| SEC.06.02 | Ensure that the Portal cannot retrieve data from the API if the CLIENT API KEY provided is invalid | A suitable error message is returned and displayed to the user |
