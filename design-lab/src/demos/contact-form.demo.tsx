// 21st.dev demo for kevingirelli/contact-form (id 35258), kept for reference: how its author uses it.
import ContactForm from "@/components/ui/contact-form";

export default function ContactFormDemo() {
  return (
    <ContactForm
      onSubmit={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }}
    />
  );
}
