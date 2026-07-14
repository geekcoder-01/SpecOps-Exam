import api from "./api";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const DraftQuestionService = {
  async getDrafts(bankId, status = "pending") {
    const res = await api.get(
      `/draft-questions/library/${bankId}`,
      {
        params: { status },
        ...authHeader(),
      }
    );

    return res.data;
  },

  async approve(id) {
    return api.post(
      `/draft-questions/${id}/approve`,
      {},
      authHeader()
    );
  },

  async reject(id) {
    return api.post(
      `/draft-questions/${id}/reject`,
      {},
      authHeader()
    );
  },

  async update(id, data) {
    return api.put(
      `/draft-questions/${id}`,
      data,
      authHeader()
    );
  },

  async remove(id) {
    return api.delete(
      `/draft-questions/${id}`,
      authHeader()
    );
  },
};

export default DraftQuestionService;