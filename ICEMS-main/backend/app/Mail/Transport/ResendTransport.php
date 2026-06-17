<?php

namespace App\Mail\Transport;

use Resend\Client;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

class ResendTransport extends AbstractTransport
{
    protected Client $resend;

    public function __construct(Client $resend)
    {
        parent::__construct();
        $this->resend = $resend;
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $this->resend->emails->send([
            'from' => $email->getFrom()[0]->getAddress(),
            'to' => array_map(fn($a) => $a->getAddress(), $email->getTo()),
            'subject' => $email->getSubject(),
            'html' => $email->getHtmlBody() ?: nl2br($email->getTextBody()),
            'text' => $email->getTextBody(),
        ]);
    }

    public function __toString(): string
    {
        return 'resend';
    }
}
