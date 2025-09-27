import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQ = () => {
  const faqs = [
    {
      question: "How long do orders usually take to ship?",
      answer: (
        <>
          Orders typically ship within 5-7 working days from the purchase date. For more details, visit the Accounts page or email{" "}
          <a href="mailto:info@mypepr.com" className="underline text-gray-900 hover:text-gray-700">
            info@mypepr.com
          </a>.
        </>
      ),
    },
    {
      question: "What if the size I am looking for is not available?",
      answer: "Contact our support for restocking updates and alternative recommendations.",
    },
    {
      question: "How do I determine the right size for me?",
      answer: "Use our size guide and measurement tips, or chat with our experts for personalized sizing advice.",
    },
    {
      question: "How do I care for and wash the product?",
      answer: "Follow the care label instructions for washing. Typically, gentle machine wash with similar colors is recommended.",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-medium text-gray-500 uppercase mb-2">We Are Here To Help</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12">Frequently Asked Questions</h2>

        <Accordion type="single" collapsible className="space-y-4 border-t border-b border-gray-200">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-b-0">
              <AccordionTrigger className="flex justify-between items-center px-6 py-4 text-gray-900 font-medium hover:text-gray-700 transition">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-700 text-sm">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12">
          <Button variant="outline" size="lg" className="border-gray-900 text-white bg-black hover:bg-white hover:text-black transition">
            See More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
