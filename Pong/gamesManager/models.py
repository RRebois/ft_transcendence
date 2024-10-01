from django.db import models
import pickle

class	BotQTable(models.Model):
	name = models.CharField(unique=True)

	q_table = models.BinaryField(blank=True)

	def	save_table(self, q_table):
		self.q_table = pickle.dumps(q_table)
		self.q_table.save()

	def	load_table(self):
		if not self.q_table:
			return {}
		return pickle.loads(self.q_table)