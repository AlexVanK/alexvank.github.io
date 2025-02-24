<?php 
if ($_SERVER['REQUEST_METHOD'] == 'POST'/* && $_POST['contactForm']*/) {

    $email_to = "alessio.vank@gmail.com";
    $email_subject = "Somebody contacted you from your website!";


    $error_message = "";
    $email_exp = "^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$^";
    //$email_exp = '/^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/';
    $contact_name = $_POST['yourname'];
    $contact_email = $_POST['youremail'];
    $contact_message = $_POST['yourmessage'];

    
    //To call in case there are some errors with the data
    function died($error_message) {
        // your error code can go here
        $response .=     "I am very sorry, but there were error(s) found with the form you submitted. ";
        $response .=     "These errors appear below.<br><br>";
        $response .=     $error_message."<br>";
        $response .=     "Please go back and fix these errors.";
        echo $response;
        die();
    }


    //Make sure data is valid
    if(!isset($contact_name) || !isset($contact_email) || !isset($contact_message)) {

        died('One of the fields seems to be empty. Try again!');       

    }else{

        if(!preg_match($email_exp,$contact_email)) {
            $error_message .= '- Please insert a valid email address.<br>';
        }

        $string_exp = "/^[A-Za-z .'-]+$/";
        if(!preg_match($string_exp,$contact_name)) {
            $error_message .= '- Please insert a valid name.<br>';
        }

        if(strlen($contact_message) < 2) {
            $error_message .= '- Please insert a valid message.<br>';
        }

        if(strlen($error_message) > 0) {
            died($error_message);
        }

    }

    //If the previous check does not die the script we can go further with the email message
    $email_message = "Message details below.\n\n";

    function clean_string($string) {
        $bad = array("content-type","bcc:","to:","cc:","href");
        return str_replace($bad,"",$string);
    }

    $email_message .= "Contact Name: ".clean_string($contact_name)."\n";
    $email_message .= "Contact Email: ".clean_string($contact_email)."\n";
    $email_message .= "Contact Message: ".clean_string($contact_message)."\n";


    // create email headers
    $headers =
        'From: '.$contact_email."\r\n".
        'Reply-To: '.$contact_email."\r\n" .
        'X-Mailer: PHP/' . phpversion();

    $result = mail($email_to, $email_subject, $email_message, $headers);

    if($result == 1) $result = "SEND"; else $result = "There was a problem sending your message.";
    
    echo $result;
}

?>