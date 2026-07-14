import api from "./api";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const QuestionLibraryService = {
  async getLibrary(bankId) {
    const res = await api.get(
      `/question-libraries/${bankId}`,
      authHeader()
    );

    return res.data;
  },

  async getSubjects(bankId) {
    const res = await api.get(
      `/question-libraries/${bankId}/subjects`,
      authHeader()
    );

    return res.data;
  },

  async getQuestions(bankId) {
    const res = await api.get(
      `/question/all-questions`,
      authHeader()
    );

    return res.data.filter(
      (question) => question.bank_id === bankId
    );
  },

  async deleteQuestion(questionId) {
    return api.delete(
      `/question/delete/${questionId}`,
      authHeader()
    );
  },
};

export default QuestionLibraryService;